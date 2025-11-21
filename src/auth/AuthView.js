// Authentication View - Login and Sign Up
import { auth } from '../auth/auth.js';
import { router } from '../utils/router.js';
import { validateEmail, validatePassword, validateDisplayName } from '../utils/validation.js';

export class AuthView {
  constructor() {
    this.mode = 'login'; // 'login' or 'signup'
  }
  
  render() {
    return `
      <div class="auth-container" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: var(--space-lg);">
        <div class="card" style="max-width: 500px; width: 100%;">
          <div class="card-header text-center">
            <h1 style="font-size: 3rem; margin-bottom: var(--space-sm);">🎲</h1>
            <h2>WIZIX DEGENERATES</h2>
            <p class="card-subtitle">The Ultimate Football Office Pool</p>
          </div>
          
          <div class="card-body">
            <!-- Tab Buttons -->
            <div style="display: flex; gap: var(--space-sm); margin-bottom: var(--space-xl);">
              <button class="btn btn-outline" id="login-tab" style="flex: 1;">
                Login
              </button>
              <button class="btn btn-ghost" id="signup-tab" style="flex: 1;">
                Sign Up
              </button>
            </div>
            
            <!-- Login Form -->
            <form id="login-form" style="display: block;">
              <div class="form-group">
                <label class="form-label" for="login-email">Email</label>
                <input 
                  type="email" 
                  id="login-email" 
                  class="form-input" 
                  placeholder="your@email.com"
                  required
                />
              </div>
              
              <div class="form-group">
                <label class="form-label" for="login-password">Password</label>
                <input 
                  type="password" 
                  id="login-password" 
                  class="form-input" 
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div id="login-error" class="form-error" style="display: none;"></div>
              
              <button type="submit" class="btn btn-primary" style="width: 100%;">
                LET'S GO
              </button>
            </form>
            
            <!-- Sign Up Form -->
            <form id="signup-form" style="display: none;">
              <div class="form-group">
                <label class="form-label" for="signup-name">Display Name</label>
                <input 
                  type="text" 
                  id="signup-name" 
                  class="form-input" 
                  placeholder="Your Name"
                  required
                />
              </div>
              
              <div class="form-group">
                <label class="form-label" for="signup-email">Email</label>
                <input 
                  type="email" 
                  id="signup-email" 
                  class="form-input" 
                  placeholder="your@email.com"
                  required
                />
              </div>
              
              <div class="form-group">
                <label class="form-label" for="signup-password">Password</label>
                <input 
                  type="password" 
                  id="signup-password" 
                  class="form-input" 
                  placeholder="••••••••"
                  required
                />
                <small style="color: var(--color-text-muted); font-size: 0.8rem;">
                  At least 8 characters, 1 uppercase, 1 lowercase, 1 number
                </small>
              </div>
              
              <div class="form-group">
                <label class="form-label" for="signup-password-confirm">Confirm Password</label>
                <input 
                  type="password" 
                  id="signup-password-confirm" 
                  class="form-input" 
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div id="signup-error" class="form-error" style="display: none;"></div>
              
              <button type="submit" class="btn btn-primary" style="width: 100%;">
                JOIN THE DEGENS
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
  }
  
  attachEventListeners() {
    // Tab switching
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    loginTab?.addEventListener('click', () => {
      this.mode = 'login';
      loginTab.className = 'btn btn-outline';
      signupTab.className = 'btn btn-ghost';
      loginForm.style.display = 'block';
      signupForm.style.display = 'none';
    });
    
    signupTab?.addEventListener('click', () => {
      this.mode = 'signup';
      loginTab.className = 'btn btn-ghost';
      signupTab.className = 'btn btn-outline';
      loginForm.style.display = 'none';
      signupForm.style.display = 'block';
    });
    
    // Login form submission
    loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleLogin();
    });
    
    // Sign up form submission
    signupForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSignup();
    });
  }
  
  async handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    
    // Validate
    if (!validateEmail(email)) {
      this.showError(errorDiv, 'Please enter a valid email address');
      return;
    }
    
    // Attempt login
    const result = await auth.signIn(email, password);
    
    if (result.success) {
      router.navigate('/dashboard');
    } else {
      this.showError(errorDiv, result.error || 'Login failed. Please try again.');
    }
  }
  
  async handleSignup() {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-password-confirm').value;
    const errorDiv = document.getElementById('signup-error');
    
    // Validate display name
    const nameValidation = validateDisplayName(name);
    if (!nameValidation.valid) {
      this.showError(errorDiv, nameValidation.message);
      return;
    }
    
    // Validate email
    if (!validateEmail(email)) {
      this.showError(errorDiv, 'Please enter a valid email address');
      return;
    }
    
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      this.showError(errorDiv, passwordValidation.message);
      return;
    }
    
    // Check password match
    if (password !== confirmPassword) {
      this.showError(errorDiv, 'Passwords do not match');
      return;
    }
    
    // Attempt signup
    const result = await auth.signUp(email, password, name);
    
    if (result.success) {
      // Auto login after signup
      const loginResult = await auth.signIn(email, password);
      if (loginResult.success) {
        router.navigate('/dashboard');
      }
    } else {
      this.showError(errorDiv, result.error || 'Sign up failed. Please try again.');
    }
  }
  
  showError(errorDiv, message) {
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      
      // Hide after 5 seconds
      setTimeout(() => {
        errorDiv.style.display = 'none';
      }, 5000);
    }
  }
}
