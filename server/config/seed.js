import pool from './database.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const seedDatabase = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('Seeding database...');

    const adminPassword = await bcrypt.hash('Admin@2024!', 12);
    const adminResult = await client.query(`
      INSERT INTO users (email, password_hash, name, role, ministry, is_approved, approved_at)
      VALUES ('admin@amini.gov.bb', $1, 'System Administrator', 'ADMIN', 'Amini HQ', true, CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO UPDATE SET name = 'System Administrator', is_approved = true
      RETURNING id
    `, [adminPassword]);
    const adminId = adminResult.rows[0].id;
    console.log('Admin user created (pre-approved)');

    const bajanxPathResult = await client.query(`
      INSERT INTO learning_paths (title, description, role_required, order_index)
      VALUES (
        'Bajan-X Superuser Training',
        'The central curriculum for public servants to learn Bajan-X API management. 4-week hybrid program combining self-paced academy content with live cohort sessions.',
        'ALL',
        1
      )
      RETURNING id
    `);
    const bajanxPathId = bajanxPathResult.rows[0].id;

    const techPathResult = await client.query(`
      INSERT INTO learning_paths (title, description, role_required, order_index)
      VALUES (
        'Technical Specialist Track',
        'Advanced track for IT staff and champions implementing Bridge and Bajan-X infrastructure.',
        'SUPERUSER',
        2
      )
      RETURNING id
    `);
    const techPathId = techPathResult.rows[0].id;

    console.log('Learning paths created');

    const bx1Result = await client.query(`
      INSERT INTO courses (title, description, thumbnail_url, level, total_duration, order_index, is_published, created_by)
      VALUES (
        'BX1: Welcome to Bajan-X & Why APIs Matter',
        'Understand the vision behind Bajan-X and why API-first government is critical for Barbados digital transformation. Learn about the problems we are solving: repeated data requests, email attachments, security worries, and how Bajan-X serves as a secure backbone for real-time data exchange across ministries.',
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop',
        'Beginner',
        '60 min',
        1,
        true,
        $1
      )
      RETURNING id
    `, [adminId]);
    const bx1Id = bx1Result.rows[0].id;

    await client.query(`
      INSERT INTO lessons (course_id, title, description, type, duration_min, order_index, content)
      VALUES
        ($1, 'Welcome to Amini Academy', 'Introduction to the Bajan-X learning platform and what to expect from this program.', 'video', 5, 1, NULL),
        ($1, 'The Problem We Are Solving', 'Why do ministries struggle with data sharing? Email attachments, repeated requests, security concerns.', 'video', 10, 2, NULL),
        ($1, 'Vision: API-First Government', 'How Singapore and Estonia transformed their governments with APIs. Barbados opportunity.', 'video', 12, 3, NULL),
        ($1, 'Bajan-X: The Secure Backbone', 'Overview of Bajan-X architecture and how it enables secure, real-time data exchange.', 'video', 15, 4, NULL),
        ($1, 'Reading: Digital Government Strategy', 'Key document on Barbados digital transformation roadmap.', 'pdf', 15, 5, NULL),
        ($1, 'BX1 Knowledge Check', 'Test your understanding of Bajan-X vision and purpose.', 'quiz', 10, 6, NULL)
    `, [bx1Id]);

    const bx1QuizLesson = await client.query(
      `SELECT id FROM lessons WHERE course_id = $1 AND type = 'quiz' LIMIT 1`,
      [bx1Id]
    );
    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, order_index)
      VALUES
        ($1, 'What problem does Bajan-X primarily solve?', '["Managing employee schedules", "Enabling secure data exchange between ministries", "Creating websites for government", "Managing payroll systems"]', 1, 'Bajan-X is designed to enable secure, real-time data exchange across ministries without emails, spreadsheets, or custom integrations.', 1),
        ($1, 'Which country is often cited as a leader in API-first government?', '["USA", "Singapore", "France", "Brazil"]', 1, 'Singapore and Estonia are frequently cited as leaders in API-first government transformation.', 2),
        ($1, 'What is one key benefit of APIs over email attachments for data sharing?', '["Emails are faster", "APIs provide real-time, secure access with proper controls", "Attachments are more secure", "APIs require no authentication"]', 1, 'APIs provide real-time access with proper authentication, access controls, and audit trails.', 3),
        ($1, 'What type of user will this program train?', '["Web developers only", "IT staff and superusers who manage ministry data", "Only administrators", "External contractors"]', 1, 'The program trains superusers including IT staff, DB admins, and data stewards from each ministry.', 4)
    `, [bx1QuizLesson.rows[0].id]);

    const bx2Result = await client.query(`
      INSERT INTO courses (title, description, thumbnail_url, level, total_duration, order_index, is_published, created_by)
      VALUES (
        'BX2: API Basics in Plain Language',
        'Conceptual grounding on what APIs are and why they matter. Learn to explain APIs to non-technical colleagues using relatable analogies. Understand API vs file sharing and see examples from countries using similar systems.',
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2034&auto=format&fit=crop',
        'Beginner',
        '60 min',
        2,
        true,
        $1
      )
      RETURNING id
    `, [adminId]);
    const bx2Id = bx2Result.rows[0].id;

    await client.query(`
      INSERT INTO lessons (course_id, title, description, type, duration_min, order_index)
      VALUES
        ($1, 'What is an API? (The Restaurant Analogy)', 'APIs explained like ordering at a restaurant - you don''t need to know how the kitchen works.', 'video', 10, 1),
        ($1, 'API vs File Sharing', 'Why APIs are superior to emailing spreadsheets and manual data transfers.', 'video', 8, 2),
        ($1, 'Real-World API Examples', 'How you already use APIs daily: banking apps, weather apps, government services.', 'video', 10, 3),
        ($1, 'The API-First Nation Vision', 'International examples: Singapore''s MyInfo, Estonia''s X-Road, and Barbados'' opportunity.', 'video', 12, 4),
        ($1, 'Handout: Explaining APIs to Colleagues', 'One-page guide for explaining APIs to non-technical team members.', 'pdf', 10, 5),
        ($1, 'BX2 Knowledge Check', 'Can you explain APIs to a non-technical colleague?', 'quiz', 10, 6)
    `, [bx2Id]);

    const bx2QuizLesson = await client.query(
      `SELECT id FROM lessons WHERE course_id = $1 AND type = 'quiz' LIMIT 1`,
      [bx2Id]
    );
    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, order_index)
      VALUES
        ($1, 'In the restaurant analogy, what does the API represent?', '["The chef", "The waiter/menu system", "The kitchen", "The ingredients"]', 1, 'The API is like a waiter/menu - it takes your request, communicates with the kitchen (database), and brings back what you ordered.', 1),
        ($1, 'What is a key advantage of APIs over emailing spreadsheets?', '["Spreadsheets are always more accurate", "APIs provide real-time data with version control", "Email is faster", "Spreadsheets don''t need authentication"]', 1, 'APIs provide real-time access to current data, eliminating version confusion and manual updates.', 2),
        ($1, 'Which best describes what an API does?', '["Stores data permanently", "Allows systems to communicate and exchange data", "Replaces all software", "Only works for websites"]', 1, 'APIs enable different systems to communicate and exchange data securely and efficiently.', 3)
    `, [bx2QuizLesson.rows[0].id]);

    const bx3Result = await client.query(`
      INSERT INTO courses (title, description, thumbnail_url, level, total_duration, order_index, is_published, created_by)
      VALUES (
        'BX3: Exploring the Bajan-X Catalog',
        'Hands-on tour of the Bajan-X catalog. Learn to login, navigate the interface, find datasets/APIs, and understand what information is available. Complete the catalog scavenger hunt lab.',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',
        'Beginner',
        '60-90 min',
        3,
        true,
        $1
      )
      RETURNING id
    `, [adminId]);
    const bx3Id = bx3Result.rows[0].id;

    await client.query(`
      INSERT INTO lessons (course_id, title, description, type, duration_min, order_index)
      VALUES
        ($1, 'Logging into Bajan-X / HCL Volt MX', 'Step-by-step guide to accessing the Bajan-X platform.', 'video', 8, 1),
        ($1, 'Navigating the Dashboard', 'Understanding the main interface, menu options, and key features.', 'video', 10, 2),
        ($1, 'The API Catalog: Finding Datasets', 'How to search, filter, and browse available APIs and datasets.', 'video', 12, 3),
        ($1, 'Understanding Catalog Entries', 'What each catalog entry tells you: owner, purpose, access level, documentation.', 'video', 10, 4),
        ($1, 'Mini-Lab 1: Catalog Scavenger Hunt', 'Hands-on exercise to find specific APIs and capture screenshots.', 'presentation', 20, 5),
        ($1, 'BX3 Knowledge Check', 'Test your ability to navigate and find information in the catalog.', 'quiz', 10, 6)
    `, [bx3Id]);

    const bx3QuizLesson = await client.query(
      `SELECT id FROM lessons WHERE course_id = $1 AND type = 'quiz' LIMIT 1`,
      [bx3Id]
    );
    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, order_index)
      VALUES
        ($1, 'What information can you find in a catalog entry?', '["Only the API name", "Owner, purpose, access level, and documentation", "Just pricing information", "Only technical specs"]', 1, 'Catalog entries contain essential information including owner, purpose, access level, and documentation links.', 1),
        ($1, 'What is the first step to access Bajan-X?', '["Call IT support", "Login with your government credentials", "Install special software", "Send an email request"]', 1, 'Users login with their government credentials to access the Bajan-X platform.', 2),
        ($1, 'Why is the catalog important for ministry users?', '["It shows employee schedules", "It helps discover available APIs and datasets across government", "It only stores documents", "It replaces email"]', 1, 'The catalog is the central place to discover what APIs and datasets are available across government.', 3)
    `, [bx3QuizLesson.rows[0].id]);

    const bx4Result = await client.query(`
      INSERT INTO courses (title, description, thumbnail_url, level, total_duration, order_index, is_published, created_by)
      VALUES (
        'BX4: Reading API Docs & Understanding Fields',
        'Learn to read API documentation effectively. Understand endpoint names, inputs/outputs, sample responses, and common data pitfalls like units, dates, and duplicates. Practice explaining fields correctly.',
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop',
        'Beginner',
        '60-90 min',
        4,
        true,
        $1
      )
      RETURNING id
    `, [adminId]);
    const bx4Id = bx4Result.rows[0].id;

    await client.query(`
      INSERT INTO lessons (course_id, title, description, type, duration_min, order_index)
      VALUES
        ($1, 'Anatomy of API Documentation', 'Understanding the structure: endpoints, methods, parameters, responses.', 'video', 12, 1),
        ($1, 'Reading Endpoint Names & URLs', 'How to interpret API endpoint paths and what they tell you about functionality.', 'video', 10, 2),
        ($1, 'Understanding Inputs (Parameters)', 'Required vs optional parameters, data types, and formatting requirements.', 'video', 12, 3),
        ($1, 'Reading Sample Responses', 'How to interpret JSON responses and understand field meanings.', 'video', 12, 4),
        ($1, 'Common Data Pitfalls', 'Watch out for: date formats, units of measurement, null values, duplicates.', 'video', 10, 5),
        ($1, 'Worksheet: Field Explanation Exercise', 'Practice explaining 3 fields from a sample API (what it is, unit, why it matters).', 'pdf', 15, 6),
        ($1, 'BX4 Knowledge Check', 'Test your ability to read and interpret API documentation.', 'quiz', 10, 7)
    `, [bx4Id]);

    const bx4QuizLesson = await client.query(
      `SELECT id FROM lessons WHERE course_id = $1 AND type = 'quiz' LIMIT 1`,
      [bx4Id]
    );
    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, order_index)
      VALUES
        ($1, 'What does an API endpoint URL typically indicate?', '["The server location only", "The specific resource or action being accessed", "The user''s email", "The file size"]', 1, 'Endpoint URLs indicate the specific resource or action, like /api/citizens or /api/documents/123.', 1),
        ($1, 'Why is understanding date formats important in API responses?', '["Dates are always the same format", "Different systems may use different formats causing misinterpretation", "Dates don''t matter in APIs", "Only IT needs to worry about dates"]', 1, 'Date formats vary (DD/MM/YYYY vs MM/DD/YYYY) and can cause serious misinterpretation if not understood.', 2),
        ($1, 'What is a common data pitfall when working with numeric fields?', '["Numbers are always accurate", "Units may differ (km vs miles, $ vs cents)", "Numbers don''t have units", "All systems use the same units"]', 1, 'Different APIs may use different units (dollars vs cents, kg vs lbs) which can cause calculation errors.', 3),
        ($1, 'What information does a sample response provide?', '["Nothing useful", "The structure and format of data you will receive", "User passwords", "Server configuration"]', 1, 'Sample responses show you exactly what data structure and format to expect from the API.', 4)
    `, [bx4QuizLesson.rows[0].id]);

    const bx5Result = await client.query(`
      INSERT INTO courses (title, description, thumbnail_url, level, total_duration, order_index, is_published, created_by)
      VALUES (
        'BX5: Testing APIs in the Playground',
        'Safe experimentation with APIs in the testing playground. Learn to run tests without exposing secrets, read JSON responses in plain language, and capture test evidence. Complete guided testing exercises.',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
        'Intermediate',
        '60 min',
        5,
        true,
        $1
      )
      RETURNING id
    `, [adminId]);
    const bx5Id = bx5Result.rows[0].id;

    await client.query(`
      INSERT INTO lessons (course_id, title, description, type, duration_min, order_index)
      VALUES
        ($1, 'Introduction to the API Playground', 'What is the playground and why it matters for safe testing.', 'video', 8, 1),
        ($1, 'Setting Up a Test Request', 'How to configure endpoint, method, headers, and parameters.', 'video', 12, 2),
        ($1, 'Running Your First Test', 'Step-by-step guide to executing a test request safely.', 'video', 10, 3),
        ($1, 'Reading JSON Responses', 'How to interpret the response: status codes, headers, body data.', 'video', 10, 4),
        ($1, 'Security: Protecting Secrets', 'Best practices for testing without exposing API keys or sensitive data.', 'video', 8, 5),
        ($1, 'Lab: Playground Test Log', 'Run 1 test and write a 2-sentence plain-English interpretation.', 'presentation', 15, 6),
        ($1, 'BX5 Knowledge Check', 'Verify your testing skills.', 'quiz', 10, 7)
    `, [bx5Id]);

    const bx5QuizLesson = await client.query(
      `SELECT id FROM lessons WHERE course_id = $1 AND type = 'quiz' LIMIT 1`,
      [bx5Id]
    );
    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, order_index)
      VALUES
        ($1, 'What is the purpose of the API playground?', '["Production deployment", "Safe testing without affecting live systems", "Storing user data", "Managing employees"]', 1, 'The playground provides a safe environment to test API calls without affecting production systems.', 1),
        ($1, 'What does a 200 status code typically mean?', '["Server error", "Request was successful", "Authentication failed", "Resource not found"]', 1, 'HTTP 200 indicates the request was successful and the server returned the expected response.', 2),
        ($1, 'Why should you never include API keys in screenshots or documentation?', '["Keys don''t matter", "Anyone with the key could access the API with your permissions", "Screenshots are private", "Keys expire immediately"]', 1, 'API keys provide access permissions - if exposed, unauthorized users could access systems with your credentials.', 3)
    `, [bx5QuizLesson.rows[0].id]);

    const bx6Result = await client.query(`
      INSERT INTO courses (title, description, thumbnail_url, level, total_duration, order_index, is_published, created_by)
      VALUES (
        'BX6: Documentation, Classification & Access Rules',
        'Governance basics for API management. Learn data classification (Public/Internal/Restricted), who approves what, and how to map to Barbados info-classification practices. Complete classification templates for your ministry datasets.',
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop',
        'Intermediate',
        '90 min',
        6,
        true,
        $1
      )
      RETURNING id
    `, [adminId]);
    const bx6Id = bx6Result.rows[0].id;

    await client.query(`
      INSERT INTO lessons (course_id, title, description, type, duration_min, order_index)
      VALUES
        ($1, 'Why Classification Matters', 'Protecting data while enabling innovation - the balance of governance.', 'video', 10, 1),
        ($1, 'Classification Levels: Public, Internal, Restricted', 'Understanding each classification level and when to apply them.', 'video', 12, 2),
        ($1, 'Barbados Information Classification Framework', 'How Bajan-X classification maps to official Barbados government standards.', 'video', 12, 3),
        ($1, 'Defining Access Rules', 'Who can access what, under what conditions, and audit requirements.', 'video', 12, 4),
        ($1, 'The Approval Process', 'Understanding who approves API access requests and the workflow.', 'video', 10, 5),
        ($1, 'Writing Good Documentation', 'What makes documentation useful: descriptions, examples, contact info.', 'video', 10, 6),
        ($1, 'Workshop: Classification Template', 'Classify one dataset and propose access rules with justification.', 'presentation', 20, 7),
        ($1, 'BX6 Knowledge Check', 'Test your understanding of classification and governance.', 'quiz', 10, 8)
    `, [bx6Id]);

    const bx6QuizLesson = await client.query(
      `SELECT id FROM lessons WHERE course_id = $1 AND type = 'quiz' LIMIT 1`,
      [bx6Id]
    );
    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, order_index)
      VALUES
        ($1, 'What classification level would citizen personal information typically have?', '["Public", "Internal", "Restricted", "Open Data"]', 2, 'Personal information requires Restricted classification with strict access controls and audit trails.', 1),
        ($1, 'Who typically approves access to Restricted APIs?', '["Anyone", "Data owner and information security", "Only IT", "No approval needed"]', 1, 'Restricted APIs require approval from both the data owner and information security teams.', 2),
        ($1, 'What should good API documentation include?', '["Just the endpoint URL", "Description, examples, contact info, and access requirements", "Only code samples", "Nothing - documentation is optional"]', 1, 'Good documentation includes clear descriptions, examples, contact information, and access requirements.', 3),
        ($1, 'Why is audit logging important for API access?', '["It slows down the system", "It provides accountability and helps detect misuse", "Audits are only for finance", "Logging is unnecessary"]', 1, 'Audit logs provide accountability, help detect unauthorized access, and support compliance requirements.', 4)
    `, [bx6QuizLesson.rows[0].id]);

    const bx7Result = await client.query(`
      INSERT INTO courses (title, description, thumbnail_url, level, total_duration, order_index, is_published, created_by)
      VALUES (
        'BX7: Publishing/Requesting APIs on Bajan-X',
        'Full workflow for API lifecycle on the HCL Volt MX platform. Learn to write clean API requests, use the minimal documentation checklist, define versions, and complete either a consumer request or publisher publish flow.',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop',
        'Advanced',
        '90 min',
        7,
        true,
        $1
      )
      RETURNING id
    `, [adminId]);
    const bx7Id = bx7Result.rows[0].id;

    await client.query(`
      INSERT INTO lessons (course_id, title, description, type, duration_min, order_index)
      VALUES
        ($1, 'Consumer vs Publisher: Two Paths', 'Understanding your role: requesting existing APIs vs publishing new ones.', 'video', 10, 1),
        ($1, 'The Consumer Path: Requesting API Access', 'Step-by-step process for requesting access to an existing API.', 'video', 12, 2),
        ($1, 'Writing a Clean API Request', 'What information to include, how to justify your need, expected timelines.', 'video', 12, 3),
        ($1, 'The Publisher Path: Publishing New APIs', 'Step-by-step process for publishing a new API from your ministry.', 'video', 15, 4),
        ($1, 'Documentation Checklist for Publishers', 'Minimum required documentation before publishing: description, schema, examples.', 'video', 10, 5),
        ($1, 'Versioning Your API (v1, v1.1, v2)', 'How to manage API versions and communicate changes to consumers.', 'video', 10, 6),
        ($1, 'Mini-Lab 2: Role-Split Exercise', 'Consumers: write an API request. Publishers: walk through publish flow.', 'presentation', 25, 7),
        ($1, 'BX7 Knowledge Check', 'Test your understanding of the request/publish workflow.', 'quiz', 10, 8)
    `, [bx7Id]);

    const bx7QuizLesson = await client.query(
      `SELECT id FROM lessons WHERE course_id = $1 AND type = 'quiz' LIMIT 1`,
      [bx7Id]
    );
    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, order_index)
      VALUES
        ($1, 'What is the first step in requesting access to an API?', '["Start using it immediately", "Identify the API in the catalog and review documentation", "Email the IT department", "Create your own version"]', 1, 'First identify the API in the catalog and review its documentation to understand requirements.', 1),
        ($1, 'What must a publisher provide before making an API available?', '["Nothing", "Minimum documentation including description, schema, and examples", "Only a URL", "Just an email address"]', 1, 'Publishers must provide documentation including description, data schema, and usage examples.', 2),
        ($1, 'Why is API versioning important?', '["It''s not important", "It allows changes without breaking existing integrations", "Versions are only for software", "Only v1 matters"]', 1, 'Versioning allows updates and improvements while maintaining compatibility for existing users.', 3),
        ($1, 'What information should an API request include?', '["Just your name", "Purpose, data needed, intended use, and justification", "Only the API name", "Password"]', 1, 'Requests should clearly state purpose, specific data needed, intended use, and business justification.', 4)
    `, [bx7QuizLesson.rows[0].id]);

    const bx8Result = await client.query(`
      INSERT INTO courses (title, description, thumbnail_url, level, total_duration, order_index, is_published, created_by)
      VALUES (
        'BX8: Monitoring, Maintenance & Capstone Showcase',
        'Learn to keep APIs healthy: understanding uptime, latency, errors in plain language. Know who monitors what and how to log issues. Complete the capstone project showcasing an end-to-end use case from your ministry.',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
        'Advanced',
        '90 min',
        8,
        true,
        $1
      )
      RETURNING id
    `, [adminId]);
    const bx8Id = bx8Result.rows[0].id;

    await client.query(`
      INSERT INTO lessons (course_id, title, description, type, duration_min, order_index)
      VALUES
        ($1, 'Introduction to API Monitoring', 'Why monitoring matters: catching issues before users do.', 'video', 8, 1),
        ($1, 'Key Metrics: Uptime, Latency, Errors', 'Understanding the health indicators in plain English.', 'video', 12, 2),
        ($1, 'Reading the Monitoring Dashboard', 'How to interpret graphs, alerts, and status indicators.', 'video', 12, 3),
        ($1, 'Who Monitors What?', 'Roles and responsibilities: ministry vs central team vs HCL support.', 'video', 10, 4),
        ($1, 'The Simple Runbook', 'What to log when something breaks, who to contact, escalation paths.', 'video', 10, 5),
        ($1, 'Template: Incident Report', 'Practice filling out a dry-run incident report from a scenario.', 'pdf', 15, 6),
        ($1, 'Capstone Project Overview', 'Requirements for your final presentation: end-to-end use case.', 'video', 8, 7),
        ($1, 'Capstone Lab: Ministry Use Case', 'Pick one dataset, walk through: find, document, classify, test, publish/request.', 'presentation', 30, 8),
        ($1, 'BX8 Final Assessment', 'Comprehensive assessment covering all Bajan-X modules.', 'quiz', 15, 9)
    `, [bx8Id]);

    const bx8QuizLesson = await client.query(
      `SELECT id FROM lessons WHERE course_id = $1 AND type = 'quiz' LIMIT 1`,
      [bx8Id]
    );
    await client.query(`
      INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, order_index)
      VALUES
        ($1, 'What does "uptime" measure?', '["How fast the API responds", "The percentage of time the API is available and working", "Number of users", "Data storage used"]', 1, 'Uptime measures the percentage of time an API is available and functioning correctly.', 1),
        ($1, 'What does high latency indicate?', '["The API is down", "Responses are taking longer than expected", "The API is very secure", "Users are happy"]', 1, 'High latency means the API is taking longer than expected to respond, which may indicate performance issues.', 2),
        ($1, 'What should you include in an incident report?', '["Nothing", "When it happened, what you observed, steps you took, who you contacted", "Just your name", "Only the date"]', 1, 'Incident reports should include timestamp, observations, actions taken, and communications made.', 3),
        ($1, 'Who should you contact first if an API stops working?', '["The Prime Minister", "Check your ministry runbook for the designated contact", "Post on social media", "Do nothing"]', 1, 'Your ministry runbook specifies the escalation path and designated contacts for different issues.', 4),
        ($1, 'What does a successful capstone project demonstrate?', '["Just logging in", "End-to-end competency: finding, documenting, classifying, testing, and requesting/publishing APIs", "Memorizing definitions", "Writing long documents"]', 1, 'The capstone demonstrates practical end-to-end skills across the entire Bajan-X workflow.', 5)
    `, [bx8QuizLesson.rows[0].id]);

    await client.query(`
      INSERT INTO learning_path_courses (learning_path_id, course_id, order_index)
      VALUES
        ($1, $2, 1),
        ($1, $3, 2),
        ($1, $4, 3),
        ($1, $5, 4),
        ($1, $6, 5),
        ($1, $7, 6),
        ($1, $8, 7),
        ($1, $9, 8)
    `, [bajanxPathId, bx1Id, bx2Id, bx3Id, bx4Id, bx5Id, bx6Id, bx7Id, bx8Id]);

    await client.query(`
      INSERT INTO learning_path_courses (learning_path_id, course_id, order_index)
      VALUES
        ($1, $2, 1),
        ($1, $3, 2),
        ($1, $4, 3)
    `, [techPathId, bx6Id, bx7Id, bx8Id]);

    console.log('Courses linked to learning paths');

    await client.query(`
      INSERT INTO ministry_stats (ministry, total_learners, active_learners, certified_learners, avg_completion_rate)
      VALUES
        ('Ministry of Industry, Innovation, Science and Technology', 45, 32, 8, 42.5),
        ('Ministry of Education and Science', 38, 28, 5, 38.2),
        ('Business Barbados', 25, 18, 4, 45.0),
        ('Trident ID', 15, 12, 3, 52.0),
        ('Ministry of Energy', 22, 15, 2, 35.5),
        ('Lands and Survey', 18, 14, 3, 40.0)
      ON CONFLICT DO NOTHING
    `);

    console.log('Ministry stats created');

    await client.query('COMMIT');
    console.log('Database seeded successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

seedDatabase()
  .then(() => {
    console.log('Seed completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
