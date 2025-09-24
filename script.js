// Recipe Finder Application
class RecipeFinder {
    constructor() {
        this.ingredients = [];
        this.recipes = [];
        
        // API Configuration - Using Spoonacular API (Free tier)
        // Note: Replace with your actual API key
        this.apiKey = 'YOUR_SPOONACULAR_API_KEY'; // Get from https://spoonacular.com/food-api
        this.baseUrl = 'https://api.spoonacular.com/recipes';
        
        this.initializeApp();
    }

    initializeApp() {
        this.bindEvents();
        this.showEmptyState();
        
        // Load demo data if API key is not set
        if (this.apiKey === 'YOUR_SPOONACULAR_API_KEY') {
            this.loadDemoData();
        }
    }

    bindEvents() {
        const ingredientInput = document.getElementById('ingredientInput');
        const addIngredientBtn = document.getElementById('addIngredient');
        const searchRecipesBtn = document.getElementById('searchRecipes');
        const modal = document.getElementById('recipeModal');
        const closeModalBtn = document.querySelector('.close-modal');

        // Add ingredient events
        addIngredientBtn.addEventListener('click', () => this.addIngredient());
        ingredientInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addIngredient();
            }
        });

        // Search recipes
        searchRecipesBtn.addEventListener('click', () => this.searchRecipes());

        // Modal events
        closeModalBtn.addEventListener('click', () => this.closeModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                this.closeModal();
            }
        });
    }

    addIngredient() {
        const input = document.getElementById('ingredientInput');
        const ingredient = input.value.trim().toLowerCase();
        
        if (!ingredient) {
            this.showError('Please enter an ingredient');
            return;
        }

        if (this.ingredients.includes(ingredient)) {
            this.showError('Ingredient already added');
            input.value = '';
            return;
        }

        if (this.ingredients.length >= 10) {
            this.showError('Maximum 10 ingredients allowed');
            return;
        }

        this.ingredients.push(ingredient);
        input.value = '';
        this.renderIngredients();
        this.updateSearchButton();
    }

    removeIngredient(ingredient) {
        this.ingredients = this.ingredients.filter(ing => ing !== ingredient);
        this.renderIngredients();
        this.updateSearchButton();
        
        if (this.ingredients.length === 0) {
            this.showEmptyState();
        }
    }

    renderIngredients() {
        const container = document.getElementById('ingredientsList');
        
        if (this.ingredients.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = this.ingredients.map(ingredient => `
            <div class="ingredient-tag">
                <span>${this.capitalizeFirst(ingredient)}</span>
                <button class="remove-ingredient" onclick="recipeFinder.removeIngredient('${ingredient}')">
                    ×
                </button>
            </div>
        `).join('');
    }

    updateSearchButton() {
        const button = document.getElementById('searchRecipes');
        button.disabled = this.ingredients.length === 0;
    }

    async searchRecipes() {
        if (this.ingredients.length === 0) return;

        this.showLoading();
        this.hideEmptyState();

        try {
            let recipes;
            
            if (this.apiKey === 'YOUR_SPOONACULAR_API_KEY') {
                // Use demo data when API key is not configured
                recipes = this.getDemoRecipes();
            } else {
                // Use actual API
                const ingredientsQuery = this.ingredients.join(',');
                const url = `${this.baseUrl}/findByIngredients?apiKey=${this.apiKey}&ingredients=${ingredientsQuery}&number=12&ranking=1&ignorePantry=true`;
                
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Failed to fetch recipes');
                }
                
                recipes = await response.json();
            }

            this.recipes = recipes;
            this.renderRecipes(recipes);
            
        } catch (error) {
            console.error('Error fetching recipes:', error);
            this.showError('Failed to load recipes. Please try again.');
            this.showEmptyState();
        } finally {
            this.hideLoading();
        }
    }

    renderRecipes(recipes) {
        const container = document.getElementById('recipesList');
        const resultsSection = document.getElementById('resultsSection');
        const resultsCount = document.getElementById('resultsCount');

        if (!recipes || recipes.length === 0) {
            this.showEmptyState();
            return;
        }

        resultsCount.textContent = `${recipes.length} recipe${recipes.length !== 1 ? 's' : ''} found`;
        resultsSection.classList.add('show');

        container.innerHTML = recipes.map((recipe, index) => `
            <div class="recipe-card" onclick="recipeFinder.showRecipeDetails(${index})">
                <img src="${recipe.image || 'https://via.placeholder.com/400x200?text=No+Image'}" 
                     alt="${recipe.title}" 
                     class="recipe-image"
                     onerror="this.src='https://via.placeholder.com/400x200?text=Recipe+Image'">
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.title}</h3>
                    <div class="recipe-meta">
                        <span><i class="fas fa-clock"></i> ${recipe.readyInMinutes || 30} min</span>
                        <span><i class="fas fa-users"></i> ${recipe.servings || 4} servings</span>
                        ${recipe.healthScore ? `<span><i class="fas fa-heart"></i> ${recipe.healthScore}% healthy</span>` : ''}
                    </div>
                    <div class="recipe-ingredients">
                        <strong>Missing ingredients:</strong> ${this.getMissingIngredients(recipe)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    getMissingIngredients(recipe) {
        if (!recipe.missedIngredients) {
            return 'None';
        }
        
        const missing = recipe.missedIngredients.slice(0, 3).map(ing => ing.name);
        return missing.length > 0 ? missing.join(', ') + (recipe.missedIngredients.length > 3 ? '...' : '') : 'None';
    }

    async showRecipeDetails(recipeIndex) {
        const recipe = this.recipes[recipeIndex];
        if (!recipe) return;

        try {
            let detailedRecipe;
            
            if (this.apiKey === 'YOUR_SPOONACULAR_API_KEY') {
                // Use demo data
                detailedRecipe = this.getDemoRecipeDetails(recipe);
            } else {
                // Fetch detailed recipe information
                const url = `${this.baseUrl}/${recipe.id}/information?apiKey=${this.apiKey}`;
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch recipe details');
                }
                
                detailedRecipe = await response.json();
            }

            this.renderRecipeModal(detailedRecipe);
            this.showModal();
            
        } catch (error) {
            console.error('Error fetching recipe details:', error);
            this.showError('Failed to load recipe details');
        }
    }

    renderRecipeModal(recipe) {
        const modalBody = document.getElementById('modalBody');
        
        const ingredients = recipe.extendedIngredients || recipe.ingredients || [];
        const instructions = recipe.instructions || recipe.summary || 'Instructions not available for this demo recipe.';
        
        modalBody.innerHTML = `
            <img src="${recipe.image || 'https://via.placeholder.com/600x250?text=Recipe+Image'}" 
                 alt="${recipe.title}" 
                 class="modal-recipe-image"
                 onerror="this.src='https://via.placeholder.com/600x250?text=Recipe+Image'">
            
            <h2 class="modal-recipe-title">${recipe.title}</h2>
            
            <div class="modal-recipe-meta">
                <span><i class="fas fa-clock"></i> ${recipe.readyInMinutes || 30} minutes</span>
                <span><i class="fas fa-users"></i> ${recipe.servings || 4} servings</span>
                ${recipe.healthScore ? `<span><i class="fas fa-heart"></i> ${recipe.healthScore}% healthy</span>` : ''}
            </div>
            
            <div class="modal-section">
                <h3>Ingredients</h3>
                <ul class="modal-ingredients-list">
                    ${ingredients.map(ing => `
                        <li>${ing.original || ing.name || ing}</li>
                    `).join('')}
                </ul>
            </div>
            
            <div class="modal-section">
                <h3>Instructions</h3>
                <div class="modal-instructions">
                    ${typeof instructions === 'string' ? instructions : 'Instructions will be available when using the full API.'}
                </div>
            </div>
        `;
    }

    showModal() {
        document.getElementById('recipeModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('recipeModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    showLoading() {
        document.getElementById('loadingState').style.display = 'block';
        document.getElementById('resultsSection').classList.remove('show');
    }

    hideLoading() {
        document.getElementById('loadingState').style.display = 'none';
    }

    showEmptyState() {
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('resultsSection').classList.remove('show');
    }

    hideEmptyState() {
        document.getElementByI