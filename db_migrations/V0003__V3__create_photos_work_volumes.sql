
CREATE TABLE t_p29757712_construction_project.photos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    user_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    caption TEXT,
    s3_key VARCHAR(500) NOT NULL,
    cdn_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p29757712_construction_project.work_volumes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    user_name VARCHAR(200) NOT NULL,
    work_date DATE NOT NULL DEFAULT CURRENT_DATE,
    work_name TEXT NOT NULL,
    unit VARCHAR(50) NOT NULL,
    volume NUMERIC(12,3) NOT NULL,
    location TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
