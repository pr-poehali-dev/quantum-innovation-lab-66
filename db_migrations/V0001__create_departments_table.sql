CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO departments (name, description) VALUES
    ('Администрация', 'Руководство и административный персонал'),
    ('IT-отдел', 'Информационные технологии и техподдержка'),
    ('Охрана', 'Служба безопасности и охраны'),
    ('Бухгалтерия', 'Финансовый учёт и отчётность');
