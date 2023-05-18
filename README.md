# Team 5 Project

## Minuteman Messageboard ##

### Team Overview ###

Shymon Samsel, GitHub: ssamsel/szzymon  
Pablo Almeida, GitHub: pabloooooo  
Nithin Joshy, GitHub: njoshy300  
Anish Gupta, Github: Anish-Gupta03  

### Innovative Idea ###

UMass Amherst is one of the largest campuses in the northeast, 
as a result it is often hard to know all that is going on around campus. 
That is why we have chosen to develop a campus forum where students can 
easily make posts about thinks going on and be able to interact with the post.
Often students receive email about events going on but in an email its not possible
to have a discussion about the event nor see how popular the event is.

### Data ###

The four types of data our application will use are:  
1. Images
    - Users will be able to post images to start a thread
    - These images will be previewed on the front page and expanded when the thread is opened
2. Captions/Questions for images
    - Each image posted must have some sort of description/caption/question
    - The text will be displayed alongside the image
3. Comments on a thread/image
    - Comments can be posted in response a thread/image
    - They will be sorted by order of posting and can reply to other comments
4. Likes to a comment/thread/image  
    - Users can upvote/like any comment/thread/image
    - The number of likes will be displayed next to a button to like the element
    - The count/button will be alongside the element

### Functionality ###
1. Users will be able to create posts about life on campus or official events happening on campus. They will be able to press a button to create a post, type in a title, attach a picture or a message about something on campus and then press another button to post it. Then, other users will be able to see what they have posted.
2. Users will be able to respond to posts using comments. After reading a post, they will be able to press a “reply” button, write their thoughts about it, and then press another button to attach it to the post. It will then be viewable by other users looking at the post, and they will be in turn able to reply to the comment and start a discussion.
3. Users will be able to like posts and comments. There will be a button that when pressed will like the post or comment. These likes will be kept track of and can be used to make good, relevant posts and comments more visible to other users.
4. Posts about official events can advertise times and locations and will allow other users to press a button to RSVP. This will serve as a way to limit attendees and communicate interest in a specific event to others on campus as well as event organizers.

## Running/Accessing the Website ##
Shymon will have this deployed and running on his server at [gutek.xyz](https://gutek.xyz)  
The 'server' is just an old computer running on his home network. 
Unfortunately the network is over coax and not fiber, so the uplink is slow. Its bandwidth is also shared with his roommates, so the website may be slow or inaccessible at times.  
### Starting the Website on Your Own Machine ###
#### Libraries ####
The project uses the following libraries: 
- Express
- Express-FileUpload
- DotENV
- PG (PostgreSQL)   
- Morgan

Install them with by running the following in the root of this project:  
`npm install`  
#### Database Installation ####
The website back-end connects to a PostgreSQL 15 server running on the same machine.  
The following instructions will vary significantly between operating systems and other factors  
I will give examples for Arch Linux, FreeBSD, and macOS (via brew, as best as I can)
1. Install PostgreSQL 15
    - Arch Linux: `$ sudo pacman -S postgresql`
    - FreeBSD: `# pkg install postgresql15-server postgresql15-client`
    - macOS: `$ brew install postgresql@15`
    - See the [PostgreSQL Download Page](https://www.postgresql.org/download/) for more information
2. Initialize the database
    - Arch Linux: `$ sudo su - postgres -c "initdb --locale en_US.UTF-8 -D '/var/lib/postgres/data'"`
    - FreeBSD: `# /usr/local/etc/rc.d/postgresql initdb`
    - macOS: You may or may not have to do this, read [this](https://wiki.postgresql.org/wiki/Homebrew) for more information
3. Start the daemon/service
    - Start one time (will not start on next boot)
        - Arch Linux: `$ sudo systemctl start postgresql`
        - FreeBSD: `# service postgresql onestart`
        - macOS: `$ brew services run postgresql`
    - Have it start on boot
        - Arch Linux: `$ sudo systemctl enable postgressql --now`
        - FreeBSD: `# sysrc postgresql_enable="YES"` and `# service postgresql start`
        - macOS: `$ brew service start postgresql`
#### Database Setup ####
1. Enable encrypted authentication (you can skip this but its good practice)
    - This again varies a ton so I will only give a general idea of how to do it
    - Find the "pg_hba.conf" file (usually somewhere in `/var` on your machine) and find these lines:
        >`# TYPE  DATABASE        USER            ADDRESS                 METHOD`  
        >`# "local" is for Unix domain socket connections only`  
        >`local   all             all                                     trust`  
        >`# IPv4 local connections:`  
        >`host    all             all             127.0.0.1/32            trust`  
        >`# IPv6 local connections:`  
        >`host    all             all             ::1/128                 trust`  
    - Under IPv4 and IPv6, change `trust` to `md5`
    - Restart the PostgreSQL service
2.  Configure the `postgres` user (this is the "root" user for postgres)
    - As the root (use sudo or doas or whatever is applicable) user run `# su - postgres`
    - Run `psql`, your prompt should look something like this: `postgres=# `
    - Set a password for the postgres user with `\password postgres`
    - Create a new database: `CREATE DATABASE <name of your db> ;`, the default for this project is `mm`
    - Create a new user: `CREASE USER <username> WITH ENCRYPTED PASSWORD '<password>' ;`, default username for this project is `mmteam`
    - Grant the user access to the database: `GRANT ALL PRIVILEGES ON DATABASE <name of your db> TO <username> ;`
    - Connect to the database: `\c <name of your db>`
    - Grant the user access to the public schema: `GRANT ALL ON SCHEMA public TO <username> ;`
    - Exit the prompt with: `\q`
    - Put your password in your .env file: `PGPASSWORD=<password>`
    - Put username and database name in .env as well if you changed the defaults
3. The `server/database.js` file will create all tables for you, so you are now finally done with configuration :)
#### Starting the Website ####
Run the server by executing `npm start` from the repository root, 
or run for deployment over https with `npm run deploy`  (put SSL keys in `/certs`)   
Navigate to [localhost:3000](http://localhost:3000) in your web browser to see the home/forums page and use the application.  
### License ###

[Apache V2 License](https://opensource.org/license/apache-2-0/)
