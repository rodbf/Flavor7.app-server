module.exports = function(server){
	var controller = require("../controllers/controller");
	server.route('/recipes')
		.get(controller.listAllRecipes)
		.post(controller.writeRecipe)
		.put(controller.putRecipe);

	server.route('/recipes/search')
		.post(controller.searchRecipes);

	server.route('/recipes/id/:id')
		.get(controller.getRecipeById);

	server.route('/recipes/name/:name')
		.get(controller.getRecipesByName);

	server.route('/recipes/filterByTag')
		.post(controller.getRecipesByTags);

	server.route('/recipes/filterByIngredient')
		.post(controller.getRecipesByIngredients);

	server.route('/ingredients')
		.get(controller.listAllIngredients)
		.post(controller.writeIngredient)
		.put(controller.putIngredient);

	server.route('/ingredients/id/:id')
		.get(controller.getIngredientById);

	server.route('/ingredients/name/:name')
		.get(controller.getIngredientsByName);

	server.route('/ingredients/filterByTag')
		.post(controller.getIngredientsByTags);

	server.route('/tags')
		.get(controller.listAllTags)
		.post(controller.writeTag)
		.put(controller.putTag);

	server.route('/tags/id/:id')
		.get(controller.getTagById);

	server.route('/tags/name/:name')
		.get(controller.getTagsByName);

	server.route('/tags/recipe/:id')
		.get(controller.getTagsByRecipe);

	server.route('/tags/ingredient/:id')
		.get(controller.getTagsByIngredient);

	server.route('/pubrecipes/id/:id')
		.get(controller.getPubRecipeById)
		.post(controller.getPubRecipeById);

	server.route('/pubrecipes/name/:name')
		.get(controller.getPubRecipesByName);

	server.route('/login')
		.post(controller.login);

	server.route('/auth')
		.post(controller.auth);

	server.route('/new-account')
		.post(controller.newAccount);

	server.route('/user/diet')
		.post(controller.getDietType);

	server.route('/user/diet/update')
		.post(controller.updateDietType);

	server.route('/user/diet/restriction/add')
		.post(controller.addBlacklistedTag);

	server.route('/user/diet/restriction/remove')
		.post(controller.removeBlacklistedTag);

	server.route('/user/diet/restriction/list')
		.post(controller.getUserBlacklistedTags);

	server.route('/user/books/list-basic')
		.post(controller.getUserBooksBasic);

	server.route('/user/books/new-bookmark')
		.post(controller.newBookmark);

	server.route('/user/books/new-book')
		.post(controller.newBook);

	server.route('/user/books/remove-favorite')
		.post(controller.removeFavorite);

	server.route('/user/books/list-detailed')
		.post(controller.getUserBooksDetailed);

	server.route('/user/books/detail')
		.post(controller.getBookDetails);

	server.route('/user/books/remove-recipe')
		.post(controller.removeRecipeFromBook);

	server.route('/user/books/update-name')
		.post(controller.updateBookName);

	server.route('/user/books/delete')
		.post(controller.deleteBook);

	server.route('/recipes/filter')
		.post(controller.getFilteredRecipes);

	server.route('/user/suggestions/week')
		.post(controller.getWeekRecipes);

	server.route('/recipe/comments')
		.post(controller.getRecipeComments);

	server.route('/recipe/new-comment')
		.post(controller.createComment);

	server.route('/recipe/vote')
		.post(controller.voteOnRecipe);

	server.route('/recipe/getVotes')
		.post(controller.getVotes);

	server.route('/recipes/explore')
		.post(controller.getFilteredRecipes);

	server.route('/tickets/new')
		.post(controller.createTicket);

	server.route('/tickets/reply')
		.post(controller.createTicketReply);

	server.route('/tickets/getUserTickets')
		.post(controller.getUserTickets);

	server.route('/tickets/getTicketMessages')
		.post(controller.getTicketMessages);

	server.route('/tickets/close')
		.post(controller.closeTicket);

	server.route('/suggestions/new')
		.post(controller.newSuggestion);

	server.route('/categories')
		.get(controller.getCategories);

	server.route('/pubrecipes/search')
		.post(controller.getSearchResults);
};