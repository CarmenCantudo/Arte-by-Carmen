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
  
  // Initialize Firestore
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
  const blogPostsContainer = document.getElementById('blog-posts');
  if (!blogPostsContainer) {
    console.error('Could not find blog-posts container element');
  } else {
    console.log('Found blog-posts container');
  }

  // Function to format date
  function formatDate(timestamp) {
    if (!timestamp) {
      console.log('No timestamp provided for date formatting');
      return '';
    }
    const date = timestamp.toDate();
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

  // Function to create a blog post card
  function createBlogPostCard(post) {
    console.log('Creating card for post:', post.title);
    const card = document.createElement('div');
    card.className = 'col-md-6 mb-4';
    
    // Get the current language from localStorage or default to 'en'
    const currentLang = localStorage.getItem('language') || 'en';
    
    // Use the appropriate title and content based on language
    const title = currentLang === 'es' ? (post.title_es || post.title) : post.title;
    let content = currentLang === 'es' ? (post.content_es || post.content) : post.content;
    
    // Create a preview of the content, handling HTML tags
    content = content.replace(/<[^>]*>/g, ''); // Remove HTML tags for preview
    content = content.substring(0, 200) + '...'; // Limit to 200 characters
    
    // Create SEO-friendly URL
    const slug = createSlug(title);
    const postUrl = `post.html?id=${post.id}&slug=${slug}`;
    
    // Use default image if no image is provided
    const imageUrl = post.imageUrl || '../static/images/blog-default.jpg';
    
    card.innerHTML = `
      <div class="card h-100">
        <a href="${postUrl}" class="text-decoration-none">
          <img src="${imageUrl}" class="card-img-top" alt="${title}" style="height: 200px; object-fit: cover;">
        </a>
        <div class="card-body">
          <a href="${postUrl}" class="text-decoration-none text-dark">
            <h5 class="card-title">${title}</h5>
          </a>
          <p class="card-text">${content}</p>
          <p class="card-text"><small class="text-muted">Published on ${formatDate(post.timestamp)}</small></p>
          <a href="${postUrl}" class="btn btn-darkorange shadow-0">Read More</a>
        </div>
      </div>
    `;
    
    return card;
  }

  // Function to display blog posts
  function displayBlogPosts() {
    console.log('Starting to fetch blog posts...');
    
    // Clear existing content
    if (blogPostsContainer) {
      blogPostsContainer.innerHTML = '';
      console.log('Cleared existing blog posts');
    }

    db.collection('blog-posts')
      .orderBy('timestamp', 'desc')
      .get()
      .then((snapshot) => {
        console.log('Fetched posts from Firestore. Number of posts:', snapshot.size);
        
        if (snapshot.empty) {
          console.log('No blog posts found in the collection');
          blogPostsContainer.innerHTML = '<div class="col-12"><p class="text-center">No blog posts yet.</p></div>';
          return;
        }

        snapshot.forEach((doc) => {
          const post = { id: doc.id, ...doc.data() };
          console.log('Processing post:', { id: post.id, title: post.title, date: post.timestamp });
          const card = createBlogPostCard(post);
          blogPostsContainer.appendChild(card);
        });
        
        console.log('Finished displaying all blog posts');
      })
      .catch((error) => {
        console.error('Error getting blog posts:', error);
        if (blogPostsContainer) {
          blogPostsContainer.innerHTML = `
            <div class="col-12">
              <div class="alert alert-danger">
                Error loading blog posts. Please try again later.<br>
                Error details: ${error.message}
              </div>
            </div>`;
        }
      });
  }

  // Initialize the blog
  console.log('Starting blog initialization...');
  displayBlogPosts();

} catch (error) {
  console.error('Error during initialization:', error);
  if (document.getElementById('blog-posts')) {
    document.getElementById('blog-posts').innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger">
          Error initializing the blog. Please try again later.<br>
          Error details: ${error.message}
        </div>
      </div>`;
  }
}