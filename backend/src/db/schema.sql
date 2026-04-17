-- OnboardIQ Schema for Azure SQL Database (Free Tier)
-- T-SQL syntax

-- Users table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    name NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) NOT NULL CHECK (role IN ('NEW_HIRE', 'HR_REVIEWER', 'HR_ADMIN', 'IT_ADMIN')),
    department NVARCHAR(255),
    employee_id NVARCHAR(50),
    joining_date DATE,
    manager_name NVARCHAR(255),
    created_at DATETIME2 DEFAULT GETDATE()
);

-- Documents table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'documents')
CREATE TABLE documents (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    doc_type NVARCHAR(100) NOT NULL,
    filename NVARCHAR(500),
    original_name NVARCHAR(500),
    status NVARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'uploaded', 'ai_processing', 'verified', 'rejected')),
    reviewer_notes NVARCHAR(MAX),
    uploaded_at DATETIME2 DEFAULT GETDATE(),
    reviewed_at DATETIME2,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Onboarding progress table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'onboarding_progress')
CREATE TABLE onboarding_progress (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    current_step INT DEFAULT 1,
    total_steps INT DEFAULT 4,
    status NVARCHAR(50) DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'completed', 'on_hold')),
    started_at DATETIME2 DEFAULT GETDATE(),
    completed_at DATETIME2,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Hardware Requests table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'hardware_requests')
CREATE TABLE hardware_requests (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    device_type NVARCHAR(50) NOT NULL CHECK (device_type IN ('laptop', 'monitor', 'keyboard', 'mouse', 'phone')),
    specs NVARCHAR(255) NOT NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'shipping', 'delivered')),
    requested_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
