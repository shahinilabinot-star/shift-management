-- SQL queries to update the database schema for enhanced shift management

-- 1. Add department field to discharged_patients table
ALTER TABLE discharged_patients 
ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- 2. Create shift_reports table for storing completed shift reports
CREATE TABLE IF NOT EXISTS shift_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shift_id VARCHAR(100) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    participants TEXT[] DEFAULT '{}',
    patients_count INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    total_tasks INTEGER DEFAULT 0,
    discharges_count INTEGER DEFAULT 0,
    deaths_count INTEGER DEFAULT 0,
    auto_stopped BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add team_members and end_approvals columns to shifts table
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS team_members TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS end_approvals TEXT[] DEFAULT '{}';

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shift_reports_shift_id ON shift_reports(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_reports_created_at ON shift_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_shifts_active ON shifts(is_active) WHERE is_active = true;

-- 5. Create function to truncate shift data (except users and shift_reports)
CREATE OR REPLACE FUNCTION truncate_shift_data()
RETURNS void AS $$
BEGIN
    TRUNCATE TABLE patients RESTART IDENTITY CASCADE;
    TRUNCATE TABLE tasks RESTART IDENTITY CASCADE;
    TRUNCATE TABLE activity_logs RESTART IDENTITY CASCADE;
    TRUNCATE TABLE discharged_patients RESTART IDENTITY CASCADE;
    TRUNCATE TABLE deceased_patients RESTART IDENTITY CASCADE;
    UPDATE shifts SET is_active = false, end_time = NOW() WHERE is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to get active shift
CREATE OR REPLACE FUNCTION get_active_shift()
RETURNS TABLE (
    id UUID,
    user_name VARCHAR(100),
    department VARCHAR(100),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN,
    bed_statuses JSONB,
    team_members TEXT[],
    end_approvals TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.user_name, s.department, s.start_time, s.end_time, 
           s.is_active, s.bed_statuses, s.team_members, s.end_approvals
    FROM shifts s
    WHERE s.is_active = true
    ORDER BY s.start_time DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to join a shift
CREATE OR REPLACE FUNCTION join_shift(shift_id_param UUID, user_name_param VARCHAR(100))
RETURNS void AS $$
BEGIN
    UPDATE shifts 
    SET team_members = array_append(team_members, user_name_param)
    WHERE id = shift_id_param 
    AND NOT (user_name_param = ANY(team_members));
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to prevent multiple active shifts
CREATE OR REPLACE FUNCTION prevent_multiple_active_shifts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = true THEN
        IF EXISTS (SELECT 1 FROM shifts WHERE is_active = true AND id != COALESCE(NEW.id, gen_random_uuid())) THEN
            RAISE EXCEPTION 'Only one active shift is allowed at a time';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger to prevent multiple active shifts
DROP TRIGGER IF EXISTS trigger_prevent_multiple_active_shifts ON shifts;
CREATE TRIGGER trigger_prevent_multiple_active_shifts
    BEFORE INSERT OR UPDATE ON shifts
    FOR EACH ROW
    EXECUTE FUNCTION prevent_multiple_active_shifts();

-- 10. Create function to auto-stop expired shifts (48 hours)
CREATE OR REPLACE FUNCTION auto_stop_expired_shifts()
RETURNS void AS $$
BEGIN
    -- Insert shift reports for expired shifts
    INSERT INTO shift_reports (shift_id, start_time, end_time, participants, auto_stopped)
    SELECT 
        id::text,
        start_time,
        NOW(),
        COALESCE(team_members, ARRAY[user_name]),
        true
    FROM shifts 
    WHERE is_active = true 
    AND start_time < NOW() - INTERVAL '48 hours';
    
    -- Stop expired shifts
    UPDATE shifts 
    SET is_active = false, end_time = NOW()
    WHERE is_active = true 
    AND start_time < NOW() - INTERVAL '48 hours';
    
    -- Truncate data if any shifts were stopped
    IF FOUND THEN
        PERFORM truncate_shift_data();
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 11. Enable RLS on shift_reports table
ALTER TABLE shift_reports ENABLE ROW LEVEL SECURITY;

-- 12. Create RLS policies for shift_reports
CREATE POLICY "allow_read_shift_reports" ON shift_reports FOR SELECT USING (true);
CREATE POLICY "allow_insert_shift_reports" ON shift_reports FOR INSERT WITH CHECK (true);

-- 13. Grant necessary permissions (removed sequence grant that was causing error)
GRANT EXECUTE ON FUNCTION truncate_shift_data() TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_shift() TO authenticated;
GRANT EXECUTE ON FUNCTION join_shift(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_stop_expired_shifts() TO authenticated;
GRANT SELECT, INSERT ON shift_reports TO authenticated;

-- 14. Optional: Create scheduled job for auto-stopping shifts (requires pg_cron extension)
-- Uncomment the following line if you have pg_cron extension enabled:
-- SELECT cron.schedule('auto-stop-shifts', '0 * * * *', 'SELECT auto_stop_expired_shifts();');

-- 15. Optional: Update existing discharged patients with default department
-- Uncomment and modify as needed:
-- UPDATE discharged_patients SET department = 'Njësia koronare' WHERE department IS NULL;

COMMIT;