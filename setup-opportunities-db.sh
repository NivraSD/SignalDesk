#!/bin/bash

echo "Setting up Opportunities tables in Supabase..."
echo ""
echo "Please run the following SQL in your Supabase SQL Editor:"
echo "1. Go to https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/sql/new"
echo "2. Copy and paste the SQL from fix_opportunities_table.sql"
echo "3. Click 'Run' to execute"
echo ""
echo "The SQL will:"
echo "- Create the opportunities table with proper schema"
echo "- Create the monitoring_alerts table"
echo "- Set up indexes and RLS policies"
echo "- Insert a test opportunity to verify it's working"
echo ""
echo "After running the SQL, refresh your SignalDesk app to see opportunities!"
echo ""
echo "Opening the SQL file for you to copy..."
cat fix_opportunities_table.sql