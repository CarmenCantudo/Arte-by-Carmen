// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAUGplFazwWOFMiYrNtWt58SMsmemMKrLk",
  authDomain: "arte-by-carmen.firebaseapp.com",
  projectId: "arte-by-carmen",
  storageBucket: "arte-by-carmen.firebasestorage.app",
  messagingSenderId: "759931214894",
  appId: "1:759931214894:web:badd051b9c1758782a53bf",
  measurementId: "G-N1MRFK2TG6"
};

// Initialize Firebase
try {
  firebase.initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
  
  const db = firebase.firestore();
  console.log('Firestore initialized');
  
  const auth = firebase.auth();

  // Check authentication state for admin link visibility
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('User is logged in:', user.email);
      document.querySelectorAll('.admin-link').forEach(link => {
        link.style.display = 'block';
      });
    } else {
      console.log('No user logged in');
      document.querySelectorAll('.admin-link').forEach(link => {
        link.style.display = 'none';
      });
    }
  });

  // DOM Elements
  const blogPostContainer = document.getElementById('blog-post');
  const commentsList = document.getElementById('comments-list');
  const commentForm = document.getElementById('comment-form');
  const prevPostBtn = document.getElementById('prev-post-btn');
  const nextPostBtn = document.getElementById('next-post-btn');
  const backToBlogBtn = document.getElementById('back-to-blog');

  // Get post ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');
  console.log('Post ID from URL:', postId);

  // Function to format date
  function formatDate(timestamp) {
    if (!timestamp) {
      console.log('No timestamp provided for date formatting');
      return '';
    }
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Function to create SEO-friendly URL from title
  function createSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
      .replace(/(^-|-$)/g, ''); // Remove leading/trailing hyphens
  }

  // Function to navigate to a post
  function navigateToPost(postId, title) {
    const slug = createSlug(title);
    window.location.href = `post.html?id=${postId}&slug=${slug}`;
  }

  // Function to update navigation buttons
  function updateNavigationButtons(currentPost, allPosts) {
    const currentIndex = allPosts.findIndex(post => post.id === currentPost.id);
    
    // Previous post button
    if (currentIndex > 0) {
      prevPostBtn.disabled = false;
      prevPostBtn.className = 'btn btn-darkorange shadow-0';
      prevPostBtn.onclick = () => navigateToPost(allPosts[currentIndex - 1].id, allPosts[currentIndex - 1].title);
    } else {
      prevPostBtn.disabled = true;
      prevPostBtn.className = 'btn btn-darkorange shadow-0';
    }

    // Next post button
    if (currentIndex < allPosts.length - 1) {
      nextPostBtn.disabled = false;
      nextPostBtn.className = 'btn btn-darkorange shadow-0';
      nextPostBtn.onclick = () => navigateToPost(allPosts[currentIndex + 1].id, allPosts[currentIndex + 1].title);
    } else {
      nextPostBtn.disabled = true;
      nextPostBtn.className = 'btn btn-darkorange shadow-0';
    }
  }

  // Function to create a comment element
  function createCommentElement(comment) {
    console.log('Creating comment element:', comment);
    const commentDiv = document.createElement('div');
    commentDiv.className = 'card mb-3';
    commentDiv.innerHTML = `
      <div class="card-body">
        <h6 class="card-subtitle mb-2 text-muted">${comment.name}</h6>
        <p class="card-text">${comment.content}</p>
        <small class="text-muted">Posted on ${formatDate(comment.timestamp)}</small>
      </div>
    `;
    return commentDiv;
  }

  // Load blog post
  function loadBlogPost() {
    if (!postId) {
      console.error('No post ID found in URL');
      window.location.href = 'index.html';
      return;
    }

    console.log('Loading blog post:', postId);
    
    // Get the current language from localStorage or default to 'en'
    const currentLang = localStorage.getItem('language') || 'en';
    
    // First, get all posts to determine navigation
    db.collection('blog-posts')
      .orderBy('timestamp', 'desc')
      .get()
      .then((snapshot) => {
        const allPosts = [];
        snapshot.forEach((doc) => {
          allPosts.push({ id: doc.id, ...doc.data() });
        });

        // Then get the current post
        db.collection('blog-posts').doc(postId)
          .get()
          .then((doc) => {
            if (doc.exists) {
              const post = doc.data();
              const title = currentLang === 'es' ? (post.title_es || post.title) : post.title;
              
              // Update page title and hero section
              document.title = `${title} - Arte by Carmen`;
              document.getElementById('post-title').textContent = title;
              
              // Update URL to be SEO-friendly
              const slug = createSlug(title);
              const newUrl = `post.html?id=${postId}&slug=${slug}`;
              window.history.pushState({}, '', newUrl);
              
              // Create the blog post content
              let postContent = `
                <div class="blog-post-content">
                  ${post.imageUrl ? `
                    <img src="${post.imageUrl}" class="img-fluid mb-4" alt="${title}" style="max-height: 400px; width: auto; margin: 0 auto; display: block;">
                  ` : ''}
                  <div class="post-meta mb-4">
                    <small class="text-muted">Published on ${formatDate(post.timestamp)}</small>
                  </div>
                  <div class="post-content">
                    ${currentLang === 'es' ? (post.content_es || post.content) : post.content}
                  </div>
                </div>
              `;
              
              // Update the blog post container
              blogPostContainer.innerHTML = postContent;
              
              // Update navigation buttons
              updateNavigationButtons({ id: postId, ...post }, allPosts);
              
              // Load comments
              loadComments(postId);
            } else {
              console.error('Post not found');
              blogPostContainer.innerHTML = `
                <div class="alert alert-danger">
                  ${currentLang === 'es' ? 'Post no encontrado' : 'Post not found'}
                </div>
              `;
            }
          })
          .catch((error) => {
            console.error('Error loading post:', error);
            blogPostContainer.innerHTML = `
              <div class="alert alert-danger">
                ${currentLang === 'es' ? 'Error al cargar el post' : 'Error loading post'}
              </div>
            `;
          });
      })
      .catch((error) => {
        console.error('Error loading posts:', error);
      });
  }

  // Function to load comments
  function loadComments(postId) {
    db.collection('blog-posts').doc(postId).collection('comments')
      .orderBy('timestamp', 'desc')
      .get()
      .then((snapshot) => {
        commentsList.innerHTML = '';
        if (snapshot.empty) {
          commentsList.innerHTML = '<p class="text-muted">No comments yet. Be the first to comment!</p>';
          return;
        }
        snapshot.forEach((doc) => {
          const comment = doc.data();
          commentsList.appendChild(createCommentElement(comment));
        });
      })
      .catch((error) => {
        console.error('Error loading comments:', error);
        commentsList.innerHTML = '<p class="text-danger">Error loading comments. Please try again later.</p>';
      });
  }

  // Handle comment submission
  commentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('comment-name').value;
    const email = document.getElementById('comment-email').value;
    const content = document.getElementById('comment-content').value;
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();

    db.collection('blog-posts').doc(postId).collection('comments').add({
      name,
      email,
      content,
      timestamp
    })
    .then(() => {
      commentForm.reset();
      loadComments(postId);
    })
    .catch((error) => {
      console.error('Error posting comment:', error);
      alert('Error posting comment. Please try again later.');
    });
  });

  // Handle back to blog button
  backToBlogBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  // Load the blog post when the page loads
  loadBlogPost();

} catch (error) {
  console.error('Error during initialization:', error);
  if (document.getElementById('blog-post')) {
    document.getElementById('blog-post').innerHTML = `
      <div class="alert alert-danger">
        Error initializing the blog post. Please try again later.<br>
        Error details: ${error.message}<br>
        <a href="index.html">Return to blog</a>
      </div>
    `;
  }
} 