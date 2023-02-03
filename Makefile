server: kill
	node server.js &

kill:
	-pkill -f 'node server.js'
