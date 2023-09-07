# UI Design

## Wireframe

The wireframes for our website are for the desktop/laptop UI.  
We have not created a logo, or decided if we will create one yet, so it is absent from the wireframes.  
This is what the homepage will resemble when completed:  
![Homepage](screenshots/home.png)  
Create account and login page:  
![Login page](screenshots/login.png)  
A page of an example thread/discussion:  
![Thread](screenshots/post_disc.png)
## Stories

### Story 1
When a user first navigates to our website, they will land on the homepage. The homepage will show a list of the threads sorted by newest reply. To start a thread, the user must have an account and be logged in. To see if they are logged in, either "Create Account/Login" or their username and avatar will be displayed at the top right.  
![Login link](screenshots/stories/login.png)  
Upon clicking the link above, or trying to post when not logged in, the user will be brought to the create account/login page, or their profile if they are already logged in.   
LOGGED IN USER -> CLICK USERNAME/AVATAR -> USER'S PROFILE PAGE  
NON LOGGED IN USER -> CLICK CREATE ACCOUNT/LOGIN -> LOGIN PAGE  
NON LOGGED IN USER -> TRY TO MAKE POST -> LOGIN PAGE

### Story 2
At the login page, a preexisting user can enter their credentials and automatically be returned to the page that brought them to the login prompt. A new user can enter information to create an account, and be returned to the page that brought them to the login page.  
LOGIN PAGE -> LOG IN / CREATE ACCOUNT -> PREVIOUS PAGE  
![Login page](screenshots/stories/login_page.png)

### Story 3
To start a thread or to reply to a thread, the user can type in the large text box at the bottom of the page. An image can be attached to the post via the upload image button. To post what they have written, along with the image (if uploaded), the user can click the submit or comment buttons. The user is then forwarded to the page where their post can be found.  
LOGGED IN USER -> MAKE POST AND SUBMIT -> POST'S PAGE  
![Create post](screenshots/stories/create_post.png)  

### Story 4
A user can search within a thread or the whole website in the dialog box at the top right of the page. The search results will be displayed similarly to how the posts are displayed on the home page.  
ANY USER -> PUT TEXT IN SEARCH BOX AND CLICK/HIT ENTER -> SEARCH RESULTS PAGE SIMILAR TO HOMEPAGE   
![Search box](screenshots/stories/search.png)

### Story 5
After a user posts or clicks on another post, they will be brought to the page for that post.  
ANY USER -> CLICK ON POST -> PAGE FOR THAT POST
## HTML & CSS Mockup

- [Homepage Mockup](forums.html)
- [Login Page Mockup](login.html)
- [Post Page Mockup](post.html)

# Homepage

![Homepage](screenshots/forums_html.png)

# Login

![Login](screenshots/login_html.png)

# Posts

![Posts](screenshots/post_html.png)