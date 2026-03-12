# Role

You are a senior backend engineer responsible for building an automated book synchronization system.
Your task is to synchronize book data from NeoDB into a Supabase database that powers a website.

# Objective

Build a reliable system that imports and maintains book metadata from NeoDB.
The system must:
- synchronize books from NeoDB
- store them in Supabase
- automatically update metadata
- avoid duplicates
- only import books published in 2026 or later

# Data Source

Primary source:
NeoDB API
Base endpoint:
https://neodb.social/api
All book data must originate from NeoDB.

# Target Database

Supabase (PostgreSQL)
The Supabase database serves as the primary database for the website.
SUPABASE_URL=https://tjqaqieefrolvtqzpaeo.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqcWFxaWVlZnJvbHZ0cXpwYWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMTg3ODgsImV4cCI6MjA4ODc5NDc4OH0.c_5SbFQ5ByQk5dMFwHMGgn3nMzbdjWvwWAVhUFvW5xo

# Data Scope Requirement

Only synchronize books with:
publication_year >= 2026
Books published before 2026 must be ignored.
If publication_year is missing:
skip the record.

# System Architecture

Implement the following pipeline:
NeoDB API
→ Data Fetcher
→ Data Normalizer
→ Duplicate Checker
→ Supabase Insert / Update
→ Logging
The website must read data only from Supabase.
Do not rely on NeoDB API during page requests.

# Database Schema

Create the following tables in Supabase.

## books
Fields:
id (uuid)
title
authors
publisher
publication_year
language
description
cover_image
neodb_id (unique)
created_at
updated_at

## ratings
Fields:
id
book_id
rating_average
rating_count
updated_at

## tags
Fields:
id
book_id
tag

# Data Ingestion

The agent must fetch book data from NeoDB and normalize the following fields:
title
authors
publisher
publication_year
language
description
cover_image
tags
rating_average
rating_count
neodb_id

# Duplicate Detection

Before inserting a book:
Check if the book already exists using:
neodb_id
If a record exists:
update metadata instead of inserting.

# Synchronization Strategy

Implement three scheduled jobs.

## Daily Job
Discover newly added books from NeoDB.
Import books where:
publication_year >= 2026

## Weekly Job
Refresh metadata including:
ratings
tags
description
cover images

## Monthly Job
Run a full verification:
- check missing fields
- repair inconsistent metadata
- remove corrupted records

# Performance Requirements

The system must:
- batch API requests
- respect API rate limits
- implement retry logic
- log failed imports
Target capability:
Import thousands of books per run.

# Data Validation

When ingesting data:
Ensure:
title exists
authors exist
publication_year >= 2026
If required fields are missing:
skip the record.

# Error Handling

Handle:
API failures
rate limits
invalid responses
Implement retry with exponential backoff.

# Logging

Log the following events:
book imported
book updated
duplicate detected
API error
Logs should include:
timestamp
neodb_id
operation result

# Deliverables

Produce the following:
1. Supabase database schema
2. NeoDB API client module
3. Data normalization logic
4. Book synchronization worker
5. Scheduled job configuration
6. Example NeoDB API requests
7. Logging and monitoring strategy

# Final Goal

A production-ready book synchronization system that automatically keeps the Supabase database up-to-date with the latest books from NeoDB, ensuring data integrity and optimal performance.
