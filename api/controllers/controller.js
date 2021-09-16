const dao = require("../../db/mysql/dao");
const parser = require("../../db/mysql/json-parser");
const tables = require("../../db/mysql/db-enum").tables;
const auth = require("../../auth/auth");

function sendJSON(res, result){
	//console.log(result);
	res.json(result);
}

function sendImage(res, result){
	console.log(result);
	res.sendFile();
}

exports.listAllRecipes = (req,res) => {
	dao.listAll(tables.RECIPES, sendJSON.bind(null, res));
}

exports.listAllIngredients = (req,res) => {
	dao.listAll(tables.INGREDIENTS, sendJSON.bind(null, res));
}

exports.listAllTags = (req,res) => {
	dao.listAll(tables.TAGS, sendJSON.bind(null, res));
}

exports.writeRecipe = (req, res) =>{
	dao.newRecipe(parser.parseWriteRecipe(req.body), sendJSON.bind(null, res));
}

exports.writeIngredient = (req, res) =>{
	dao.newIngredient(parser.parseWriteIngredient(req.body), sendJSON.bind(null, res));
}

exports.writeTag = (req, res) =>{
	dao.newTag(parser.parseWriteTag(req.body), sendJSON.bind(null, res));
}

exports.getRecipeById = (req, res) =>{
	dao.getRecipeById(req.params.id, sendJSON.bind(null, res));
}

exports.getRecipesByName = (req, res) =>{
	dao.getRecipeByName(req.params.name, sendJSON.bind(null, res));
}

exports.getRecipesByIngredients = (req, res) =>{
	dao.getRecipesByIngredients(parser.parseFilter(req.body), sendJSON.bind(null,res));
}

exports.getRecipesByTags = (req, res) =>{
	dao.getRecipesByTags(parser.parseFilter(req.body), sendJSON.bind(null,res));
}

exports.getIngredientById = (req, res) =>{
	dao.getIngredientById(req.params.id, sendJSON.bind(null, res));
}

exports.getIngredientsByName = (req, res) =>{
	dao.getIngredientsByName(req.params.name, sendJSON.bind(null, res));
}

exports.getIngredientsByTags = (req, res) =>{
	dao.getIngredientsByTags(parser.parseFilter(req.body), sendJSON.bind(null,res));
}

exports.getTagById = (req, res) =>{
	dao.getIngredientById(req.params.id, sendJSON.bind(null, res));
}

exports.getTagsByName = (req, res) =>{
	dao.getTagsByName(req.params.name, sendJSON.bind(null, res));
}

exports.getTagsByRecipe = (req, res) =>{
	dao.getRecipeTags(req.params.id, sendJSON.bind(null, res));
}

exports.getTagsByIngredient = (req, res) =>{
	dao.getIngredientTags(req.params.id, sendJSON.bind(null, res));
}

exports.putIngredient = (req,res) =>{
	dao.putIngredient(parser.parseUpdateIngredient(req.body), sendJSON.bind(null,res));
}

exports.putRecipe = (req, res) =>{
	dao.putRecipe(parser.parseUpdateRecipe(req.body), sendJSON.bind(null, res));
}

exports.putTag = (req, res) =>{
	dao.putTag(parser.parseUpdateTag(req.body), sendJSON.bind(null,res));
}

exports.getPubRecipeById = (req, res) =>{
	ret = {};
	auth.authorize(req.body.jwt, body => {
		if(body.RES_CODE != 10012){//not verified
			dao.getPubRecipeById(null, req.body.id, (err, response)=>{
				response.RES_CODE = 9999;
				response.RES_MSG = "no auth op"
				sendJSON(res, response);
			});
		}
		else{
			ret.jwt = body.AUTH;
			dao.getPubRecipeById(body.USER, req.body.id, (err, result) => {
				if(err == null){
					ret.RES_CODE = 10013;
					ret.RES_MSG = "Success";
					ret.recipe = result.recipe;
					ret.ing = result.ing;
					ret.steps = result.steps;
					ret.isFavorite = result.isFavorite;
				}
				else{
					ret.RES_CODE = 10014;
					ret.RES_MSG = "Unhandled error";
				}
				sendJSON(res, ret);
			})
		}
	})
}

exports.getPubRecipesByName = (req, res) => {
	dao.getPubRecipesByName(req.params.name, (response) => {
		sendJSON(res, response);
	});
}

exports.login = (req, res) => {
	auth.login(req.body.login, req.body.pass, (response) => {
		sendJSON(res, response);
	});
}

exports.auth = (req, res) => {
	auth.authenticate(req.body.jwt, (response) => {
		sendJSON(res, response);
	});
}

exports.newAccount = (req, res) => {
	auth.newAccount(req.body.login, req.body.pass, req.body.display, (response) => {
		sendJSON(res, response);
	});
}

exports.searchRecipes = (req, res) => {
	ret = {};
	params = {};
	params.str = (req.body.search_filters)?req.body.search_filters.str || false:false
	params.description = (req.body.search_filters)?req.body.search_filters.description || false:false
	params.duration = (req.body.search_filters)?req.body.search_filters.duration || false:false
	userFilters = req.body.user_filters || false;
	if(userFilters.BLing || userFilters.BLtag || userFilters.WLtag){
		auth.authenticate(req.body.jwt, body => {
			if(body.RES_CODE == 10000 && body.ACCOUNT_TYPE > 0){
				ret.jwt = body.AUTH;
				params.blacklistIngredients = userFilters.BLing || false;
				params.blacklistTags = userFilters.BLtag || false;
				params.whitelistTags = userFilters.WLtag || false;
				params.userId = body.USER;
			}
			ret.RES_CODE = body.RES_CODE;
			ret.RES_MSG = body.RES_MSG;
			dao.searchRecipes(params, (err, result) => {
				ret.recipes = result;
				sendJSON(res, ret);
			});
		});
	}
	else{
		ret.RES_CODE = 9999;
		ret.RES_MSG = "no auth op";
		dao.searchRecipes(params, (err, result) => {
			ret.recipes = result;
			sendJSON(res, ret);
		});
	}
}

exports.updateDietType = (req, res) => {
	ret = {};
	auth.authorize(req.body.jwt, body => {
		if(body.RES_CODE != 10012){
			sendJSON(res, ret);			
		}
		else{
			ret.jwt = body.AUTH;
			dao.updateDietType(body.USER, req.body.diet, (err, result) => {
				if(err == null && result.affectedRows > 0){
					ret.RES_CODE = 10013;
					ret.RES_MSG = "Success";
				}
				else{
					ret.RES_CODE = 10014;
					ret.RES_MSG = "Unhandled error";
				}
				sendJSON(res, ret);
			})
		}
	})
}

exports.addBlacklistedTag = (req, res) => {
	ret = {};
	auth.authorize(req.body.jwt, body => {
		if(body.RES_CODE != 10012){//not verified
			sendJSON(res, ret);			
		}
		else{
			ret.jwt = body.AUTH;
			dao.addBlacklistedTag(body.USER, req.body.id_tag, (err, result) => {
				if(err == null && result.affectedRows > 0){
					ret.RES_CODE = 10013;
					ret.RES_MSG = "Success";
				}
				else{
					ret.RES_CODE = 10014;
					ret.RES_MSG = "Unhandled error";
				}
				sendJSON(res, ret);
			})
		}
	})
}

exports.removeBlacklistedTag = (req, res) => {
	ret = {};
	auth.authorize(req.body.jwt, body => {
		if(body.RES_CODE != 10012){//not verified
			sendJSON(res, ret);			
		}
		else{
			ret.jwt = body.AUTH;
			dao.removeBlacklistedTag(body.USER, req.body.id_tag, (err, result) => {
				if(err == null && result.affectedRows > 0){
					ret.RES_CODE = 10013;
					ret.RES_MSG = "Success";
				}
				else{
					ret.RES_CODE = 10014;
					ret.RES_MSG = "Unhandled error";
				}
				sendJSON(res, ret);
			})
		}
	})
}

exports.getUserBlacklistedTags = (req, res) => {
	ret = {};
	auth.authorize(req.body.jwt, body => {
		if(body.RES_CODE != 10012){//not verified
			sendJSON(res, ret);			
		}
		else{
			ret.jwt = body.AUTH;
			dao.getUserBlacklistedTags(body.USER, (err, result) => {
				if(err == null){
					ret.RES_CODE = 10013;
					ret.RES_MSG = "Success";
					ret.TAGS = result;
				}
				else{
					ret.RES_CODE = 10014;
					ret.RES_MSG = "Unhandled error";
				}
				sendJSON(res, ret);
			})
		}
	})
}

exports.getDietType = (req, res) => {
	ret = {};
	auth.authorize(req.body.jwt, body => {
		if(body.RES_CODE != 10012){//not verified
			sendJSON(res, ret);			
		}
		else{
			ret.jwt = body.AUTH;
			dao.getDietType(body.USER, (err, result) => {
				if(err == null){
					ret.RES_CODE = 10013;
					ret.RES_MSG = "Success";
					ret.DIET = result[0].diet_type;
				}
				else{
					ret.RES_CODE = 10014;
					ret.RES_MSG = "Unhandled error";
				}
				sendJSON(res, ret);
			})
		}
	})

}

exports.getUserBooksBasic = (req, res) => {
	ret = {};
	auth.authorize(req.body.jwt, body => {
		if(body.RES_CODE != 10012){//not verified
			sendJSON(res, ret);			
		}
		else{
			ret.jwt = body.AUTH;
			dao.getUserBooksBasic(body.USER, (err, result) => {
				if(err == null){
					ret.RES_CODE = 10013;
					ret.RES_MSG = "Success";
					ret.BOOKS = result;
				}
				else{
					ret.RES_CODE = 10014;
					ret.RES_MSG = "Unhandled error";
				}
				sendJSON(res, ret);
			})
		}
	})
}

exports.newBookmark = (req, res) => {
	ret = {};
	auth.authorize(req.body.jwt, body => {
		if(body.RES_CODE != 10012){//not verified
			sendJSON(res, ret);			
		}
		else{
			ret.jwt = body.AUTH;
			dao.createBookmark(req.body.book_id, req.body.recipe_id, (err, result) => {
				if(err==null){
					ret.RES_CODE = 10013;
					ret.RES_MSG = "Success";
				}
				else{
					ret.RES_CODE = 10014;
					ret.RES_MSG = "Unhandled error";
				}
				sendJSON(res, ret);
			})
		}
	})

}

exports.newBook = (req, res) => {
	ret = {};
	auth.authorize(req.body.jwt, body => {
		if(body.RES_CODE != 10012){//not verified
			sendJSON(res, ret);			
		}
		else{
			ret.jwt = body.AUTH;
			dao.createBook(body.USER, req.body.book_name, req.body.recipe_id, (err, result) => {
				if(err==null){
					ret.RES_CODE = 10013;
					ret.RES_MSG = "Success";
				}
				else{
					ret.RES_CODE = 10014;
					ret.RES_MSG = "Unhandled error";
				}
				sendJSON(res, ret);
			})
		}
	})

}



exports.removeFavorite = (req, res) => {
	ret = {};
	auth.authorize(req.body.jwt, body => {
		if(body.RES_CODE != 10012){//not verified
			sendJSON(res, ret);			
		}
		else{
			ret.jwt = body.AUTH;
			dao.removeFavorite(body.USER, req.body.recipe_id, (err, result) => {
				if(err==null){
					ret.RES_CODE = 10013;
					ret.RES_MSG = "Success";
				}
				else{
					ret.RES_CODE = 10014;
					ret.RES_MSG = "Unhandled error";
				}
				sendJSON(res, ret);
			})
		}
	})

}

exports.getUserBooksDetailed = (req, res) => {
	ret = {};
	auth.authorize(req.body.jwt, body => {
		if(body.RES_CODE != 10012){//not verified
			sendJSON(res, ret);			
		}
		else{
			ret.jwt = body.AUTH;
			dao.getUserBooksDetailed(body.USER, req.body.owned_books, (err, result) => {
				if(err == null){
					ret.RES_CODE = 10013;
					ret.RES_MSG = "Success";
					ret.books = result;
				}
				else{
					ret.RES_CODE = 10014;
					ret.RES_MSG = "Unhandled error";
				}
				sendJSON(res, ret);
			})
		}
	})
}


exports.getBookDetails = (req, res) => {
	ret = {};
	auth.authorize(req.body.jwt, body => {
		if(body.RES_CODE != 10012){//not verified
			sendJSON(res, ret);			
		}
		else{
			ret.jwt = body.AUTH;
			dao.getBookDetails(req.body.id, (err, result) => {
				if(err == null){
					ret.RES_CODE = 10013;
					ret.RES_MSG = "Success";
					ret.book_id = result[0].id;
					ret.book_name = result[0].name;
					ret.owner_id = result[0].owner;
					ret.owner_name = result[0].owner_name;
					ret.recipes = result[0].recipes;
					ret.is_default = result[0].is_default;
				}
				else{
					ret.RES_CODE = 10014;
					ret.RES_MSG = "Unhandled error";
				}
				sendJSON(res, ret);
			})
		}
	})
}

exports.removeRecipeFromBook = (req, res) => {
	ret = {};
	auth.authorize(req.body.jwt, body => {
		if(body.RES_CODE != 10012){//not verified
			sendJSON(res, ret);			
		}
		else{
			ret.jwt = body.AUTH;
			dao.removeRecipeFromBook(req.body.id_book, req.body.id_recipe, (err, result) => {
				if(err == null){
					ret.RES_CODE = 10013;
					ret.RES_MSG = "Success";
				}
				else{
					ret.RES_CODE = 10014;
					ret.RES_MSG = "Unhandled error";
				}
				sendJSON(res, ret);
			})
		}
	})
}

exports.updateBookName = (req, res) => {
	ret = {};
	auth.authorize(req.body.jwt, body => {
		if(body.RES_CODE != 10012){//not verified
			sendJSON(res, ret);			
		}
		else{
			ret.jwt = body.AUTH;
			dao.updateBookName(req.body.book_name, req.body.book_id, (err, result) => {
				if(err == null){
					ret.RES_CODE = 10013;
					ret.RES_MSG = "Success";
				}
				else{
					ret.RES_CODE = 10014;
					ret.RES_MSG = "Unhandled error";
				}
				sendJSON(res, ret);
			})
		}
	})
}


exports.deleteBook = (req, res) => {
	ret = {};
	auth.authorize(req.body.jwt, body => {
		if(body.RES_CODE != 10012){//not verified
			sendJSON(res, ret);			
		}
		else{
			ret.jwt = body.AUTH;
			dao.deleteBook(req.body.id, (err, result) => {
				if(err == null){
					ret.RES_CODE = 10013;
					ret.RES_MSG = "Success";
				}
				else{
					ret.RES_CODE = 10014;
					ret.RES_MSG = "Unhandled error";
				}
				sendJSON(res, ret);
			})
		}
	})
}


exports.getFilteredRecipes = (req, res) => {
	ret = {};
	let jwt = req.body.jwt;
	if(jwt == ""){
		let params = {};
		params.max_results = req.body.max_results;
		params.sort_order = req.body.sort_order;
		params.meal_whitelist_array = req.body.meal_whitelist_array;
		dao.getFilteredRecipes(null, params, (err, result) => {
			ret.jwt = "";
			if(err == null){
				ret.RES_CODE = 10013;
				ret.RES_MSG = "Success";
				ret.RESULT = result[0];
			}
			else{
				ret.RES_CODE = 10014;
				ret.RES_MSG = "Unhandled error";
			}
			sendJSON(res, ret);
		});
	}
	else{
		auth.authorize(req.body.jwt, body => {
			if(body.RES_CODE != 10012){//not verified
				sendJSON(res, ret);			
			}
			else{
				ret.jwt = body.AUTH;
				dao.getFilteredRecipes(body.USER, req.body, (err, result) => {
					if(err == null){
						ret.RES_CODE = 10013;
						ret.RES_MSG = "Success";
						ret.RESULT = result[0];
					}
					else{
						ret.RES_CODE = 10014;
						ret.RES_MSG = "Unhandled error";
					}
					sendJSON(res, ret);
				});
			}
		});
	}
}


exports.getWeekRecipes = (req, res) => {
	ret = {};
	auth.authorize(req.body.jwt, body => {
		if(body.RES_CODE != 10012){//not verified
			sendJSON(res, ret);			
		}
		else{
			ret.jwt = body.AUTH;
			dao.getWeekRecipes(1, body.USER, (err, result) => {
				if(err == null){
					ret.RES_CODE = 10013;
					ret.RES_MSG = "Success";
					ret.RECIPES = result;
				}
				else{
					ret.RES_CODE = 10014;
					ret.RES_MSG = "Unhandled error";
				}
				sendJSON(res, ret);
			})
		}
	})
}

exports.getRecipeComments = (req, res) => {
	ret = {};
	dao.getRecipeComments(req.body.recipe_id, (err, result) => {
		if(err == null){
			ret.RES_CODE = 10013;
			ret.RES_MSG = "Success";
			ret.COMMENTS = result;
		}
		else{
			ret.RES_CODE = 10014;
			ret.RES_MSG = "Unhandled error";
		}
		sendJSON(res, ret);
	})
}


exports.createComment = (req, res) => {
	ret = {};
	auth.authorize(req.body.jwt, body => {
		if(body.RES_CODE != 10012){//not verified
			sendJSON(res, ret);			
		}
		else{
			ret.jwt = body.AUTH;
			dao.createComment(body.USER, req.body.parent_id, req.body.recipe_id, req.body.content, (err, result) => {
				if(err == null){
					ret.RES_CODE = 10013;
					ret.RES_MSG = "Success";
				}
				else{
					ret.RES_CODE = 10014;
					ret.RES_MSG = "Unhandled error";
				}
				sendJSON(res, ret);
			})
		}
	})
}

exports.voteOnRecipe = (req, res) => {
	ret = {};
	auth.authorize(req.body.jwt, body => {
		if(body.RES_CODE != 10012){//not verified
			sendJSON(res, ret);			
		}
		else{
			ret.jwt = body.AUTH;
			dao.voteOnRecipe(body.USER, req.body.recipe_id, req.body.vote, (err, result) => {
				if(err == null){
					ret.RES_CODE = 10013;
					ret.RES_MSG = "Success";
					ret.vote_state = result;
				}
				else{
					ret.RES_CODE = 10014;
					ret.RES_MSG = "Unhandled error";
				}
				sendJSON(res, ret);
			})
		}
	})
}


exports.getVotes = (req, res) => {
	ret = {};
	if(req.body.jwt){
		auth.authorize(req.body.jwt, body => {
			if(body.RES_CODE != 10012){//not verified
				sendJSON(res, ret);			
			}
			else{
				ret.jwt = body.AUTH;
				dao.getVotesForUser(body.USER, req.body.recipe_id, (err, result) => {
					if(err == null){
						ret.RES_CODE = 10013;
						ret.RES_MSG = "Success";
						ret.RECIPE_ID = result.id_recipe;
						ret.USER_ID = result.id_user;
						ret.vote = result.vote;
						ret.upvotes = result.upvotes;
						ret.downvotes = result.downvotes;
					}
					else{
						ret.RES_CODE = 10014;
						ret.RES_MSG = "Unhandled error";
					}
					sendJSON(res, ret);
				})
			}
		})
	}
	else{
		dao.getVotesNoAuth(req.body.recipe_id, (err, result) => {
			if(err == null){
				ret.RES_CODE = 10013;
				ret.RES_MSG = "Success";
				ret.RECIPE_ID = result.id_recipe;
				ret.upvotes = result.upvotes;
				ret.downvotes = result.downvotes;
			}
			else{
				ret.RES_CODE = 10014;
				ret.RES_MSG = "Unhandled error";
			}
			sendJSON(res, ret);
		})
	}
}



exports.createTicket = (req, res) => {
	ret = {};
	auth.authorize(req.body.jwt, body => {
		if(body.RES_CODE != 10012){//not verified
			sendJSON(res, ret);			
		}
		else{
			ret.jwt = body.AUTH;
			dao.createTicket(body.USER, req.body.title, req.body.message, (err, result) => {
				if(err == null){
					ret.RES_CODE = 10013;
					ret.RES_MSG = "Success";
				}
				else{
					ret.RES_CODE = 10014;
					ret.RES_MSG = "Unhandled error";
				}
				sendJSON(res, ret);
			})
		}
	})
}

exports.createTicketReply = (req, res) => {
	ret = {};
	auth.authorize(req.body.jwt, body => {
		if(body.RES_CODE != 10012){//not verified
			sendJSON(res, ret);			
		}
		else{
			ret.jwt = body.AUTH;
			dao.createTicketReply(req.body.thread, body.USER, req.body.message, (err, result) => {
				if(err == null){
					ret.RES_CODE = 10013;
					ret.RES_MSG = "Success";
				}
				else{
					ret.RES_CODE = 10014;
					ret.RES_MSG = "Unhandled error";
				}
				sendJSON(res, ret);
			})
		}
	})
}


exports.getUserTickets = (req, res) => {
	ret = {};
	auth.authorize(req.body.jwt, body => {
		if(body.RES_CODE != 10012){//not verified
			sendJSON(res, ret);			
		}
		else{
			ret.jwt = body.AUTH;
			dao.getUserTickets(body.USER, (err, result) => {
				if(err == null){
					ret.RES_CODE = 10013;
					ret.RES_MSG = "Success";
					ret.result = result;
				}
				else{
					ret.RES_CODE = 10014;
					ret.RES_MSG = "Unhandled error";
				}
				sendJSON(res, ret);
			})
		}
	})
}


exports.getTicketMessages = (req, res) => {
	ret = {};
	auth.authorize(req.body.jwt, body => {
		if(body.RES_CODE != 10012){//not verified
			sendJSON(res, ret);			
		}
		else{
			ret.jwt = body.AUTH;
			dao.getTicketMessages(req.body.thread, (err, result) => {
				if(err == null){
					ret.RES_CODE = 10013;
					ret.RES_MSG = "Success";
					ret.result = result;
				}
				else{
					ret.RES_CODE = 10014;
					ret.RES_MSG = "Unhandled error";
				}
				sendJSON(res, ret);
			})
		}
	})
}


exports.closeTicket = (req, res) => {
	ret = {};
	auth.authorize(req.body.jwt, body => {
		if(body.RES_CODE != 10012){//not verified
			sendJSON(res, ret);			
		}
		else{
			ret.jwt = body.AUTH;
			dao.closeTicket(req.body.thread, req.body.wasSolved, (err, result) => {
				if(err == null){
					ret.RES_CODE = 10013;
					ret.RES_MSG = "Success";
				}
				else{
					ret.RES_CODE = 10014;
					ret.RES_MSG = "Unhandled error";
				}
				sendJSON(res, ret);
			})
		}
	})
}


exports.newSuggestion = (req, res) => {
	ret = {};
	auth.authorize(req.body.jwt, body => {
		if(body.RES_CODE != 10012){//not verified
			sendJSON(res, ret);			
		}
		else{
			ret.jwt = body.AUTH;
			dao.newSuggestion(body.USER, req.body.subject, req.body.message, (err, result) => {
				if(err == null){
					ret.RES_CODE = 10013;
					ret.RES_MSG = "Success";
				}
				else{
					ret.RES_CODE = 10014;
					ret.RES_MSG = "Unhandled error";
				}
				sendJSON(res, ret);
			})
		}
	})
}

exports.getCategories = (req, res) => {
	ret = {};
	dao.getCategories((err, result) => {
		if(err == null){
			ret.RES_CODE = 9999;
			ret.RES_MSG = "NO AUTH OP";
			ret.diets = result.diets;
			ret.meals = result.meals;
		}
		else{
			ret.RES_CODE = 10014;
			ret.RES_MSG = "Unhandled error";
		}
		sendJSON(res, ret);
	})
}

exports.getSearchResults = (req, res) => {
	let ret = {};
	let params = {};

	params.search_str = req.body.search_str || null;
	params.diet = req.body.diet || null;
	params.meal = req.body.meal || null;
	params.filterRestrictions = null;
	params.filterDownvotes = null;
	params.prepTime = req.body.prep_time || null;

	if(!req.body.jwt){
		dao.getSearchResults(null, params, (err, result) => {
			if(err == null){
				ret.RES_CODE = 10013;
				ret.RES_MSG = "Success";
				ret.result = result;
			}
			else{
				ret.RES_CODE = 10014;
				ret.RES_MSG = "Unhandled error";
			}
			sendJSON(res, ret);
		});
	}
	else{
		auth.authorize(req.body.jwt, body => {
			if(body.RES_CODE != 10012){//not verified
				sendJSON(res, ret);			
			}
			else{

				params.filterRestrictions = req.body.filter_restrictions || null;
				params.filterDownvotes = req.body.filter_downvotes || null;

				ret.jwt = body.AUTH;
				dao.getSearchResults(body.USER, params, (err, result) => {
					if(err == null){
						ret.RES_CODE = 10013;
						ret.RES_MSG = "Success";
						ret.result = result;
					}
					else{
						ret.RES_CODE = 10014;
						ret.RES_MSG = "Unhandled error";
					}
					sendJSON(res, ret);
				});
			}
		});

	}
}