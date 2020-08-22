import Search from "./models/Search";
import Recipe from "./models/Recipe";
import List from "./models/List";
import Likes from "./models/Likes";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeView";
import * as listView from "./views/listView";
import * as likesView from "./views/likesView";
import {
  elements,
  renderLoader,
  clearLoader
} from "./views/base";

//global state of the app
//search obj
//curr recipe obj
//shopping list obj
//liked recipes
const state = {};

///////////////////////////////////////////
//search ctrl
const controlSearch = async () => {
  //1 get query from the view
  const query = searchView.getInput(); //todo

  if (query) {
    //2) new search obj and add it to state
    state.search = new Search(query);

    //3) prepare UI for result
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);

    try {
      //4) Search for recipe and parse ingredients
      await state.search.getResults();

      //5) render results in UI
      clearLoader();
      searchView.renderResults(state.search.result);
    } catch (err) {
      alert("some thing went wrong with search...");
      clearLoader();
    }
  }
};

elements.searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  controlSearch();
});

elements.searchResPages.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-inline");
  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});

///////////////////////////////////////////
//Recipe ctrl
const controlRecipe = async () => {
  // Get ID from url
  const id = window.location.hash.replace("#", "");

  if (id) {
    // Prepare UI for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

    // Highlight selected search item
    if (state.search) searchView.highlightSelected(id);

    // Create new recipe object
    state.recipe = new Recipe(id);

    try {
      // Get recipe data and parse ingredients
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();

      // Calculate servings and time
      state.recipe.calcTime();
      state.recipe.calcServings();

      // Render recipe
      clearLoader();
      recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
    } catch (err) {
      console.log(err);
      alert("Error processing recipe!");
    }
  }
};

["hashchange", "load"].forEach((event) =>
  window.addEventListener(event, controlRecipe)
);

////////////////////
//control List
const controlList = () => {
  //creat new list if there is non
  if (!state.list) state.list = new List();

  //add each ingredient to the list
  state.recipe.ingredients.forEach((el) => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

// handel delete and update list item events
elements.shopping.addEventListener("click", (e) => {
  const id = e.target.closest(".shopping__item").dataset.itemid;
  //handle the delete
  if (e.target.matches(".shopping__delete, .shopping__delete *")) {
    //delete from state
    state.list.deleteItem(id);

    //delete from UI
    listView.deleteItem(id);

    //handle the count update
  } else if (e.target.matches(".shopping__count-value")) {
    const val = parseFloat(e.target.value, 10);
    state.list.updateCount(id, val);
  }
});

///////////////
//like controller

const controlLike = () => {
  if (!state.likes) state.likes = new Likes();
  const currentID = state.recipe.id;

  //user has not likes curr recipe
  if (!state.likes.isLiked(currentID)) {
    //add like to the state
    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );

    //toggle the like button
    likesView.toggleLikeBtn(true);

    //add like to the UO list
    likesView.renderLike(newLike);

    //user has likes curr recipe
  } else {
    //remove like to the state
    state.likes.deleteLike(currentID);

    //toggle the like button
    likesView.toggleLikeBtn(false);

    //remove like to the UO list
    likesView.deleteLike(currentID);
  }

  likesView.toggleLikeMenu(state.likes.getNumOfLikes());
};

//restore like recipe on page load
window.addEventListener("load", () => {
  state.likes = new Likes();

  //restore likes
  state.likes.readStorage();

  //toggle the bun
  likesView.toggleLikeMenu(state.likes.getNumOfLikes());

  //render the existing likes
  state.likes.likes.forEach((like) => likesView.renderLike(like));
});

//handling recipe btn clicks
elements.recipe.addEventListener("click", (e) => {
  if (e.target.matches(".btn-decrease, .btn-decrease *")) {
    //dec button is clicked
    if (state.recipe.servings > 1) {
      state.recipe.updateServings("dec");
      recipeView.updateServingsIngredients(state.recipe);
    }
  } else if (e.target.matches(".btn-increase, .btn-increase *")) {
    //inc button is clicked
    state.recipe.updateServings("inc");
    recipeView.updateServingsIngredients(state.recipe);
  } else if (e.target.matches(".recipe__btn--add, .recipe__btn--add *")) {
    //add ing to list shopping
    controlList();
  } else if (e.target.matches(".recipe__love , .recipe__love *")) {
    // call like controller
    controlLike();
  }
});