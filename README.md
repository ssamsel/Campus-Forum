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

### How to Start App ###
Express, Express-FileUpload, DotENV, and PostgreSQL are required for this to work.  
Install them with by running the following in the root of this project:  
`npm install`  
Run the server by executing `npm start` from the repository root, 
or run for deployment over https with `npm run deploy`  (put keys in /certs)   
Navigate to [localhost:3000](http://localhost:3000) in your web browser to see the home/forums page and use the application.  
Sometimes Shymon will have this deployed and running on his server at [gutek.xyz](https://gutek.xyz)  
### License ###

[Apache V2 License](https://opensource.org/license/apache-2-0/)
