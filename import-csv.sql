COPY journalist_registry (name, outlet, beat, twitter_handle, email, tier, industry)
FROM '/Users/jonathanliebowitz/Desktop/signaldesk-v3/journalists.csv'
DELIMITER ','
CSV HEADER;
