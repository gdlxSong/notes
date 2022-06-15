## postgres install pure docker.




```bash
docker run	--name postgres \
	-e POSTGRES_PASSWORD=tomasdong \
	-e PGDATA=/var/lib/postgresql/data/pgdata \
    -v taskcafe-postgres:/var/lib/ /data \
    postgres:12.3-alpine
```







```bash
docker run -d -p 8000:8000 --name flarum \
  -v /tmp/data:/data \
  -e "DB_HOST=db" \
  -e "DB_NAME=flarum" \
  -e "DB_USER=root" \
  -e "DB_PASSWORD=tomasdong" \
  -e "FLARUM_BASE_URL=http://39.103.128.226:60800" \
  crazymax/flarum:latest
```