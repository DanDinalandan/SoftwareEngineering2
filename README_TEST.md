## To test the project you need these apps installed into your system so it can run smoothly.
* Docker
* Node.js
* Git

when pulling the project from github repository one thing to note is that the api-key 
of the database or this project's supabase is removed due to security reasons to 
reapply it again what you need is;


# 1 - supabase setup
to go to the designated supabase of this project (ask the developers for this)
# 1.2 - creating new supabase
if you can't access it you may create your own supabase account and connect 
your own the schema of the database is in the "apps/backend/supabase/schema.sql" run
that command and your database is done
# 2 - setting up the project
grab the supabase url and its service role key and paste it on a .env.docker on both 'softwareenginnering2/.env.docker' and softwareenginnering2/apps/backend/.env.docker
# 3 - final changes 
once done you may change/replace the Lan IP with your computer LAN IP inside of the .'softwareengineering2/env.docker' then you may proceed on starting the program 
LAN_IP=192.168.100.210
EXPO_PUBLIC_API_BASE_URL=http://192.168.100.210:3000' 

# 3.5 Find your OpenAI API key at https://platform.openai.com/api-keys

# 4 - to run everything 
 reassure that your DOCKER DESKTOP is running in the background or it will not run!
 run this command to start the project

```bash
docker compose --env-file .env.docker up --build
```

and to stop everything

run 
```bash
docker compose down
```

