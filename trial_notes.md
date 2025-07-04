deno run -A functions/generate_meditation_script.ts

# stop the stack

supabase stop

# remove all Supabase containers & their data volumes

docker rm -f $(docker ps -aq -f name=supabase)
docker volume rm $(docker volume ls -q -f name=supabase)

# (optional) wipe the cached images too

docker image prune -a # deletes _all_ unused images
