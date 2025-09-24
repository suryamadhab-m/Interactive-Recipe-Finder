// Recipe Finder Application
class RecipeFinder {
    constructor() {
        this.ingredients = [];
        this.recipes = [];
        
        // API Configuration - Using Spoonacular API (Free tier)
        // Note: Replace with your actual API key
        this.apiKey = 'c8839b7255d145c7a0bc2d3b836f540'; // Get from https://spoonacular.com/food-api
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
        document.getElementById('emptyState').style.display = 'none';
    }

    showError(message) {
        const errorToast = document.getElementById('errorToast');
        const errorMessage = document.getElementById('errorMessage');
        
        errorMessage.textContent = message;
        errorToast.style.display = 'flex';
        
        setTimeout(() => {
            errorToast.style.display = 'none';
        }, 4000);
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Demo data for when API key is not configured
    loadDemoData() {
        console.log('Using demo data. To use real data, get an API key from https://spoonacular.com/food-api');
    }

    getDemoRecipes() {
        // Filter demo recipes based on available ingredients
        const availableIngredients = this.ingredients;
        
        const demoRecipes = [
            {
                id: 1,
                title: "Classic Chicken Stir Fry",
                image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                readyInMinutes: 25,
                servings: 4,
                healthScore: 78,
                missedIngredients: [
                    { name: "soy sauce" },
                    { name: "garlic" }
                ],
                usedIngredients: availableIngredients.filter(ing => 
                    ['chicken', 'rice', 'vegetables', 'onion', 'bell pepper'].includes(ing)
                )
            },
            {
                id: 2,
                title: "Creamy Tomato Pasta",
                image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                readyInMinutes: 20,
                servings: 3,
                healthScore: 65,
                missedIngredients: [
                    { name: "heavy cream" },
                    { name: "parmesan cheese" }
                ],
                usedIngredients: availableIngredients.filter(ing => 
                    ['tomatoes', 'pasta', 'garlic', 'onion', 'basil'].includes(ing)
                )
            },
            {
                id: 3,
                title: "Vegetable Fried Rice",
                image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                readyInMinutes: 15,
                servings: 4,
                healthScore: 82,
                missedIngredients: [
                    { name: "eggs" },
                    { name: "green onions" }
                ],
                usedIngredients: availableIngredients.filter(ing => 
                    ['rice', 'vegetables', 'carrots', 'peas', 'garlic', 'onion'].includes(ing)
                )
            },
            {
                id: 4,
                title: "Grilled Chicken Salad",
                image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                readyInMinutes: 30,
                servings: 2,
                healthScore: 92,
                missedIngredients: [
                    { name: "olive oil" },
                    { name: "lemon juice" }
                ],
                usedIngredients: availableIngredients.filter(ing => 
                    ['chicken', 'lettuce', 'tomatoes', 'cucumber', 'avocado'].includes(ing)
                )
            },
            {
                id: 5,
                title: "Beef and Broccoli",
                image: "https://images.unsplash.com/photo-1599921841143-819b44ac8c4c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                readyInMinutes: 25,
                servings: 4,
                healthScore: 75,
                missedIngredients: [
                    { name: "beef broth" },
                    { name: "cornstarch" }
                ],
                usedIngredients: availableIngredients.filter(ing => 
                    ['beef', 'broccoli', 'garlic', 'ginger', 'rice'].includes(ing)
                )
            },
            {
                id: 6,
                title: "Mushroom Risotto",
                image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                readyInMinutes: 40,
                servings: 4,
                healthScore: 70,
                missedIngredients: [
                    { name: "arborio rice" },
                    { name: "white wine" }
                ],
                usedIngredients: availableIngredients.filter(ing => 
                    ['mushrooms', 'onion', 'garlic', 'cheese', 'butter'].includes(ing)
                )
            },
            {
                id: 7,
                title: "Fish Tacos",
                image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                readyInMinutes: 20,
                servings: 3,
                healthScore: 85,
                missedIngredients: [
                    { name: "lime" },
                    { name: "cilantro" }
                ],
                usedIngredients: availableIngredients.filter(ing => 
                    ['fish', 'tortillas', 'cabbage', 'avocado', 'tomatoes'].includes(ing)
                )
            },
            {
                id: 8,
                title: "Vegetarian Chili",
                image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                readyInMinutes: 45,
                servings: 6,
                healthScore: 88,
                missedIngredients: [
                    { name: "cumin" },
                    { name: "chili powder" }
                ],
                usedIngredients: availableIngredients.filter(ing => 
                    ['beans', 'tomatoes', 'onion', 'bell pepper', 'garlic'].includes(ing)
                )
            }
        ];

        // Sort by number of matching ingredients (descending)
        return demoRecipes
            .map(recipe => ({
                ...recipe,
                matchScore: recipe.usedIngredients.length
            }))
            .filter(recipe => recipe.matchScore > 0 || availableIngredients.length === 0)
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 8);
    }

    getDemoRecipeDetails(recipe) {
        const demoDetails = {
            1: {
                ...recipe,
                extendedIngredients: [
                    { original: "1 lb chicken breast, sliced thin" },
                    { original: "2 cups mixed vegetables (bell peppers, snap peas, carrots)" },
                    { original: "3 cloves garlic, minced" },
                    { original: "1 onion, sliced" },
                    { original: "3 tbsp soy sauce" },
                    { original: "2 tbsp vegetable oil" },
                    { original: "1 tsp fresh ginger, grated" },
                    { original: "2 cups cooked rice" }
                ],
                instructions: "1. Heat oil in a large wok or skillet over high heat. 2. Add chicken and cook until golden, about 5-6 minutes. 3. Add garlic and ginger, stir for 30 seconds. 4. Add vegetables and onion, stir-fry for 3-4 minutes. 5. Add soy sauce and toss everything together. 6. Serve immediately over rice."
            },
            2: {
                ...recipe,
                extendedIngredients: [
                    { original: "12 oz pasta (penne or rigatoni)" },
                    { original: "1 can (14 oz) crushed tomatoes" },
                    { original: "1/2 cup heavy cream" },
                    { original: "3 cloves garlic, minced" },
                    { original: "1 small onion, diced" },
                    { original: "1/2 cup parmesan cheese, grated" },
                    { original: "2 tbsp olive oil" },
                    { original: "Fresh basil leaves" },
                    { original: "Salt and pepper to taste" }
                ],
                instructions: "1. Cook pasta according to package directions. 2. In a large pan, heat olive oil and sauté onion until soft. 3. Add garlic and cook for 1 minute. 4. Add crushed tomatoes and simmer for 10 minutes. 5. Stir in heavy cream and parmesan cheese. 6. Add cooked pasta and toss. 7. Garnish with fresh basil and serve."
            },
            3: {
                ...recipe,
                extendedIngredients: [
                    { original: "3 cups cooked rice (preferably day-old)" },
                    { original: "2 cups mixed vegetables (carrots, peas, corn)" },
                    { original: "3 eggs, beaten" },
                    { original: "3 cloves garlic, minced" },
                    { original: "1 onion, diced" },
                    { original: "3 green onions, chopped" },
                    { original: "3 tbsp soy sauce" },
                    { original: "2 tbsp vegetable oil" }
                ],
                instructions: "1. Heat oil in a large wok or pan. 2. Add beaten eggs and scramble, then remove. 3. Add more oil, then garlic and onion, stir-fry until fragrant. 4. Add vegetables and cook for 2-3 minutes. 5. Add rice, breaking up clumps. 6. Add soy sauce and scrambled eggs back in. 7. Garnish with green onions and serve."
            },
            4: {
                ...recipe,
                extendedIngredients: [
                    { original: "2 chicken breasts" },
                    { original: "4 cups mixed lettuce" },
                    { original: "2 tomatoes, diced" },
                    { original: "1 cucumber, sliced" },
                    { original: "1 avocado, sliced" },
                    { original: "1/4 cup olive oil" },
                    { original: "2 tbsp lemon juice" },
                    { original: "Salt and pepper to taste" }
                ],
                instructions: "1. Season chicken with salt and pepper. 2. Grill chicken for 6-7 minutes per side until cooked through. 3. Let rest for 5 minutes, then slice. 4. In a large bowl, combine lettuce, tomatoes, cucumber, and avocado. 5. Whisk together olive oil and lemon juice for dressing. 6. Top salad with sliced chicken and drizzle with dressing."
            }
        };

        return demoDetails[recipe.id] || {
            ...recipe,
            extendedIngredients: [
                { original: "Various ingredients based on recipe" },
                { original: "Seasonings and spices" },
                { original: "Cooking oil or butter" }
            ],
            instructions: "This is a demo recipe. Detailed instructions would be available with a full API implementation. The recipe involves preparing the main ingredients, combining them according to traditional cooking methods, and seasoning to taste."
        };
    }
}

// Initialize the application
let recipeFinder;

document.addEventListener('DOMContentLoaded', () => {
    recipeFinder = new RecipeFinder();
});

// Utility functions for global access
window.recipeFinder = {
    removeIngredient: (ingredient) => recipeFinder.removeIngredient(ingredient),
    showRecipeDetails: (index) => recipeFinder.showRecipeDetails(index)
};
