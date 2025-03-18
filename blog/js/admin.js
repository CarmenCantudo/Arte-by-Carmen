// Firebase configuration
const firebaseConfig = {
  // You'll need to replace this with your Firebase config
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
  const storage = firebase.storage();
  console.log('Firestore and Storage initialized');
  
  const auth = firebase.auth();

  // DOM Elements
  const loginForm = document.getElementById('login-form');
  const postForm = document.getElementById('post-form');
  const adminLoginForm = document.getElementById('admin-login');
  const blogPostForm = document.getElementById('blog-post-form');
  const logoutBtn = document.getElementById('logout-btn');
  const postsTableBody = document.getElementById('posts-table-body');
  const editPostModalEl = document.getElementById('editPostModal');
  const editPostForm = document.getElementById('edit-post-form');
  const saveEditBtn = document.getElementById('save-edit-btn');
  const postTitleInput = document.getElementById('post-title');
  const postContentInput = document.getElementById('post-content');
  const postImageInput = document.getElementById('post-image');
  const postImageUrlInput = document.getElementById('post-image-url');
  const imagePreview = document.getElementById('image-preview');
  const editImageInput = document.getElementById('edit-image');
  const editImageUrlInput = document.getElementById('edit-image-url-input');
  const editImagePreview = document.getElementById('edit-image-preview');
  const editImageUrl = document.getElementById('edit-image-url');

  // Initialize Bootstrap Modal
  let editPostModal;
  document.addEventListener('DOMContentLoaded', () => {
    editPostModal = new bootstrap.Modal(editPostModalEl);
  });

  // Function to get TinyMCE editor instances
  function getEditor(id) {
    return tinymce.get(id);
  }

  // Load existing posts
  function loadPosts() {
    postsTableBody.innerHTML = '';
    db.collection('blog-posts')
      .orderBy('timestamp', 'desc')
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          const post = doc.data();
          const row = document.createElement('tr');
          const date = post.timestamp ? new Date(post.timestamp.toDate()).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }) : 'No date';
          
          row.innerHTML = `
            <td>${post.title}</td>
            <td>${date}</td>
            <td>
              <button class="btn btn-sm btn-primary edit-post" data-id="${doc.id}">Edit</button>
              <button class="btn btn-sm btn-danger delete-post" data-id="${doc.id}">Delete</button>
            </td>
          `;
          
          postsTableBody.appendChild(row);
        });
      })
      .catch((error) => {
        console.error('Error loading posts:', error);
        alert('Error loading posts: ' + error.message);
      });
  }

  // Check authentication state
  auth.onAuthStateChanged((user) => {
    if (user) {
      // User is signed in
      loginForm.style.display = 'none';
      postForm.style.display = 'block';
      loadPosts(); // Load posts when user is signed in
      console.log('User is signed in:', user.email);
      // Show admin link in navbar
      document.querySelectorAll('.admin-link').forEach(link => {
        link.style.display = 'block';
      });
    } else {
      // User is signed out
      loginForm.style.display = 'block';
      postForm.style.display = 'none';
      console.log('User is signed out');
      // Hide admin link in navbar
      document.querySelectorAll('.admin-link').forEach(link => {
        link.style.display = 'none';
      });
    }
  });

  // Handle login
  adminLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    console.log('Attempting login with:', email);
    console.log('Firebase Auth State:', auth.currentUser);
    
    // Clear any previous error messages
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger mt-3';
    const existingError = document.querySelector('.alert-danger');
    if (existingError) {
      existingError.remove();
    }
    
    auth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        console.log('Logged in successfully:', userCredential.user.email);
        console.log('User UID:', userCredential.user.uid);
        // Remove any error messages on success
        const errorDiv = document.querySelector('.alert-danger');
        if (errorDiv) {
          errorDiv.remove();
        }
      })
      .catch((error) => {
        console.error('Login error code:', error.code);
        console.error('Login error message:', error.message);
        console.error('Full error:', error);
        
        let errorMessage = 'Error logging in: ';
        switch (error.code) {
          case 'auth/invalid-credential':
            errorMessage += 'Invalid email or password. Please check your credentials.';
            break;
          case 'auth/user-not-found':
            errorMessage += 'No user found with this email address.';
            break;
          case 'auth/wrong-password':
            errorMessage += 'Incorrect password.';
            break;
          case 'auth/invalid-email':
            errorMessage += 'Invalid email address format.';
            break;
          case 'auth/too-many-requests':
            errorMessage += 'Too many failed login attempts. Please try again later.';
            break;
          case 'auth/user-disabled':
            errorMessage += 'This account has been disabled.';
            break;
          default:
            errorMessage += error.message;
        }
        
        // Display error message in the form
        errorDiv.textContent = errorMessage;
        adminLoginForm.appendChild(errorDiv);
      });
  });

  // Handle logout
  logoutBtn.addEventListener('click', () => {
    auth.signOut()
      .then(() => {
        console.log('Logged out successfully');
      })
      .catch((error) => {
        console.error('Error logging out:', error);
      });
  });

  // Image preview functionality for new post
  function updateImagePreview(input, previewElement) {
    const file = input.files[0];
    const urlInput = input.id === 'post-image' ? postImageUrlInput : editImageUrlInput;
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewElement.innerHTML = `
          <img src="${e.target.result}" class="img-fluid" style="max-height: 200px;">
        `;
        urlInput.value = ''; // Clear URL input when file is selected
      };
      reader.readAsDataURL(file);
    } else if (urlInput.value) {
      previewElement.innerHTML = `
        <img src="${urlInput.value}" class="img-fluid" style="max-height: 200px;">
      `;
    } else {
      previewElement.innerHTML = '';
    }
  }

  // Add event listeners for image inputs
  postImageInput.addEventListener('change', () => updateImagePreview(postImageInput, imagePreview));
  postImageUrlInput.addEventListener('input', () => updateImagePreview(postImageUrlInput, imagePreview));
  editImageInput.addEventListener('change', () => updateImagePreview(editImageInput, editImagePreview));
  editImageUrlInput.addEventListener('input', () => updateImagePreview(editImageUrlInput, editImagePreview));

  // Handle form submission
  blogPostForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = postTitleInput.value;
    const content = postContentInput.value;
    const imageFile = postImageInput.files[0];
    const imageUrl = postImageUrlInput.value;
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();

    try {
      let finalImageUrl = imageUrl;
      
      // Upload image if file is selected
      if (imageFile) {
        const storageRef = storage.ref();
        const imageRef = storageRef.child(`blog-images/${Date.now()}_${imageFile.name}`);
        await imageRef.put(imageFile);
        finalImageUrl = await imageRef.getDownloadURL();
      }

      // Create blog post
      await db.collection('blog-posts').add({
        title,
        content,
        imageUrl: finalImageUrl,
        timestamp
      });

      // Reset form
      blogPostForm.reset();
      imagePreview.innerHTML = '';
      
      // Show success message
      alert('Blog post published successfully!');
      
      // Redirect to blog index
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Error publishing post:', error);
      alert('Error publishing post: ' + error.message);
    }
  });

  // Handle post editing
  postsTableBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-post')) {
      const postId = e.target.dataset.id;
      db.collection('blog-posts').doc(postId).get()
        .then((doc) => {
          const post = doc.data();
          document.getElementById('edit-post-id').value = postId;
          document.getElementById('edit-title').value = post.title;
          const editor = getEditor('edit-content');
          if (editor) {
            editor.setContent(post.content);
          } else {
            document.getElementById('edit-content').value = post.content;
          }
          
          // Set current image if exists
          if (post.imageUrl) {
            editImageUrl.value = post.imageUrl;
            editImageUrlInput.value = post.imageUrl;
            editImagePreview.innerHTML = `
              <img src="${post.imageUrl}" class="img-fluid" style="max-height: 200px;">
            `;
          } else {
            editImageUrl.value = '';
            editImageUrlInput.value = '';
            editImagePreview.innerHTML = '';
          }
          
          editPostModal.show();
        })
        .catch((error) => {
          console.error('Error loading post:', error);
          alert('Error loading post: ' + error.message);
        });
    } else if (e.target.classList.contains('delete-post')) {
      if (confirm('Are you sure you want to delete this post?')) {
        const postId = e.target.dataset.id;
        db.collection('blog-posts').doc(postId).delete()
          .then(() => {
            alert('Post deleted successfully!');
            loadPosts(); // Reload posts list
          })
          .catch((error) => {
            console.error('Error deleting post:', error);
            alert('Error deleting post: ' + error.message);
          });
      }
    }
  });

  // Handle save edit
  saveEditBtn.addEventListener('click', async () => {
    const postId = document.getElementById('edit-post-id').value;
    const title = document.getElementById('edit-title').value;
    const content = getEditor('edit-content')?.getContent() || document.getElementById('edit-content').value;
    const imageFile = editImageInput.files[0];
    const imageUrl = editImageUrlInput.value;
    const currentImageUrl = editImageUrl.value;

    try {
      let finalImageUrl = imageUrl || currentImageUrl;

      // Upload new image if file is selected
      if (imageFile) {
        const storageRef = storage.ref();
        const imageRef = storageRef.child(`blog-images/${Date.now()}_${imageFile.name}`);
        await imageRef.put(imageFile);
        finalImageUrl = await imageRef.getDownloadURL();
      }

      // Update post
      await db.collection('blog-posts').doc(postId).update({
        title,
        content,
        imageUrl: finalImageUrl,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      alert('Post updated successfully!');
      editPostModal.hide();
      loadPosts(); // Reload posts list
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Error updating post: ' + error.message);
    }
  });

} catch (error) {
  console.error('Error during initialization:', error);
  alert('Error initializing the admin interface: ' + error.message);
} 