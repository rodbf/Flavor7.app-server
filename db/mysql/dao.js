const env = 'development';

const resultEnum = require('./result-enum');
const tables = require('./db-enum').tables;
const columns = require('./db-enum').cols;

const async = require('async');

const con = require('./pool');

function insert(table, cols, data, callback){
	let query = "INSERT INTO "+table+" ("+cols.join(",")+") VALUES ?";
	con.query(query, [data], (err, result) => callback(insertErrResultHandler(err, result)));
}

function insertErrResultHandler(err, result){
	let output = {};
	if(err){
		output = errHandler(err);
	} else {
		output.code = resultEnum.SUCCESS.code;
		output.msg = resultEnum.SUCCESS.message;
		if(result.affectedRows > 1){
			output.count = result.affectedRows;
		} else {
			output.id = result.insertId;
		};
	};
	return output;
}

function errHandler(err){
	output = {};
	console.log(err);

	if(resultEnum.hasOwnProperty(err.code)){
		output = resultEnum[err.code];
	}else{
		output.code = resultEnum.UNHANDLED_ERROR.code;
		output.msg = resultEnum.UNHANDLED_ERROR.message+err.code;
	}
	return output;
}

function select(table, callback, cols = "*", clause = "", options = ""){
	let query = "SELECT "+cols.join(",")+" FROM "+table+" "+clause+" "+options;
	con.query(query)
}

function writeRecipe(input, callback){
	const cols = [columns.RECIPES.NAME, columns.RECIPES.DESC, columns.RECIPES.STEPS];
	const data = [[input.name, input.description, input.steps]];

	const output = {"name": input.name};

	insert(tables.RECIPES, cols, data, result => callback(Object.assign(output, result)));
}

function writeIngredient(input, callback){
	const cols = [columns.INGREDIENTS.NAME];
	const data = [[input.name]];

	const output = {"name": input.name};

	insert(tables.INGREDIENTS, cols, data, result => callback(Object.assign(output, result)));
}

function writeTag(input, callback){
	const cols = [columns.TAGS.NAME];
	const data = [[input.name]];

	const output = {"name": input.name};

	insert(tables.TAGS, cols, data, result => callback(Object.assign(output, result)));
}

function writeRecipeIngredients(recipeId, input, callback){
	const cols = [columns.RECIPE_INGREDIENTS.RECIPE_ID, columns.RECIPE_INGREDIENTS.INGREDIENT_ID, columns.RECIPE_INGREDIENTS.AMOUNT, columns.RECIPE_INGREDIENTS.UNIT_ID];
	const data = [];

	input.forEach(ing =>{
		data.push([recipeId, ing.id, ing.amount, ing.unit]);
	});

	insert(tables.RECIPE_INGREDIENTS, cols, data, result => callback(result));
}

function writeRecipeTags(recipeId, input, callback){
	const cols = [columns.RECIPE_TAGS.RECIPE_ID, columns.RECIPE_TAGS.TAG_ID];
	const data = [];

	input.forEach(tag =>{
		data.push([recipeId, tag.id]);
	});

	insert(tables.RECIPE_TAGS, cols, data, result => callback(result));
}

function writeIngredientTags(ingredientId, input, callback){
	const cols = [columns.INGREDIENT_TAGS.INGREDIENT_ID, columns.INGREDIENT_TAGS.TAG_ID];
	const data = [];

	input.forEach(tag =>{
		data.push([ingredientId, tag.id]);
	});

	insert(tables.INGREDIENT_TAGS, cols, data, result => callback(result));
}

module.exports.newRecipe = function(input, callback){
	const output = {};

	writeRecipe(input.recipe, resultRecipe =>{
		output.recipe = resultRecipe;

		if(resultRecipe.code === resultEnum.SUCCESS.code){
			async.parallel([
				function(asyncCallback){
					writeRecipeIngredients(resultRecipe.id, input.ingredients, (result) => asyncCallback(null, result));
				},
				function(asyncCallback){
					writeRecipeTags(resultRecipe.id, input.tags, (result) => asyncCallback(null, result));
				}],
				function(err, asyncResults){
					output.ing = asyncResults[0];
					output.tag = asyncResults[1];
					callback(output);
				}
			);
		} else {
			callback(output);
		};
	});
}

module.exports.newIngredient = function(input,callback){
	const output = {};

	writeIngredient(input.ingredient, resultIngredient =>{
		output.ing = resultIngredient;

		if(resultIngredient.code === resultEnum.SUCCESS.code){
			writeIngredientTags(resultIngredient.id, input.tags, (result) => {
				output.tag = result
				callback(output);
			});
		} else {
			callback(output);
		};
	});
}

module.exports.newTag = function(input,callback){
	const output = {};

	writeTag(input.tag, result =>{
		output.tag = result;
		callback(output);
	});
}

module.exports.listAll = function(table, callback){
	let output = {};
	const query = "SELECT * FROM "+table+" ORDER BY id";
	con.query(query, (err, result) =>{
		if(err){
			output = errHandler(err);
		} else {
			output = result;
		};
		callback(output);
	});
}

module.exports.getRecipeById = function(id, callback){
	let output = {};
	const query = "SELECT "+columns.RECIPES.ID+", "+columns.RECIPES.NAME+" as 'name', "+columns.RECIPES.DESC+" as 'description', "+columns.RECIPES.STEPS+" "+
					"FROM "+tables.RECIPES+" "+
					"WHERE "+columns.RECIPES.ID+" = ?";
	con.query(query, [[id]], (err, result) =>{
		if(err){
			output = errHandler(err);
		}
		else{
			output = result;
		}
		callback(output);
	});
}

module.exports.getRecipesByName = function(name, callback){
	let output = {};
	const query = "SELECT "+columns.RECIPES.ID+", "+columns.RECIPES.NAME+" as 'name', "+columns.RECIPES.DESC+" as 'description', "+columns.RECIPES.STEPS+" "+
					"FROM "+tables.RECIPES+" "+
					"WHERE "+columns.RECIPES.NAME+" LIKE ?";
	con.query(query, [["%"+name+"%"]], (err, result) =>{
		if(err){
			output = errHandler(err);
		}
		else{
			output = result;
		}
		callback(output);
	});
}

module.exports.getRecipeTags = function(id, callback){
	let output = {};
	const query = "SELECT t."+columns.RECIPE_TAGS.TAG_NAME+" as 'tag' "+
					"FROM "+tables.RECIPE_TAGS+" r "+
					"LEFT JOIN "+tables.TAGS+" t "+
						"ON t."+columns.TAGS.ID+" = r."+columns.RECIPE_TAGS.TAG_ID+" "+
					"WHERE r."+columns.RECIPE_TAGS.RECIPE_ID+" = ?";
	con.query(query, [[id]], (err, result) =>{
		if(err){
			output = errHandler(err);
		} 
		else{
			output = result;
		}
		callback(output);
	});
}

module.exports.getIngredientTags = function(id, callback){
	let output = {};
	const query = "SELECT t."+columns.RECIPE_TAGS.TAG_NAME+" as 'tag' "+
					"FROM "+tables.INGREDIENT_TAGS+" r "+
					"LEFT JOIN "+tables.TAGS+" t "+
						"ON t."+columns.TAGS.ID+" = r."+columns.INGREDIENT_TAGS.TAG_ID+" "+
					"WHERE r."+columns.INGREDIENT_TAGS.INGREDIENT_ID+" = ?";
	con.query(query, [[id]], (err, result) =>{
		if(err){
			output = errHandler(err);
		} 
		else{
			output = result;
		}
		callback(output);
	});
}

module.exports.getRecipesByIngredients = function(args, callback){
	let output = {};

	let query = "SELECT "+columns.RECIPE_INGREDIENTS.RECIPE_ID+" AS 'id' FROM "+tables.RECIPE_INGREDIENTS+" WHERE "+columns.RECIPE_INGREDIENTS.INGREDIENT_ID+" IN ?";

	if(args.filter !== "whitelist"){
		query = "SELECT "+columns.RECIPE_INGREDIENTS.RECIPE_ID+" AS 'id' FROM "+tables.RECIPE_INGREDIENTS+" WHERE "+columns.RECIPE_INGREDIENTS.RECIPE_ID+" NOT IN ("+query+")";
		if(args.filter === "bw")
			query = query + " AND "+columns.RECIPE_INGREDIENTS.INGREDIENT_ID+" IN ?";
	}

	query = query + " GROUP BY "+columns.RECIPES.ID+" ORDER BY "+columns.RECIPES.ID;

	query = "SELECT r."+columns.RECIPES.ID+", r."+columns.RECIPES.NAME+" AS 'name' FROM "+tables.RECIPES+" r JOIN ("+query+") s ON r."+columns.RECIPES.ID+" = s.id";
	con.query(query, args.data, (err, result) =>{
		if(err){
			output = errHandler(err);
		} 
		else{
			output = result;
		}
		callback(output);
	});
}

module.exports.getRecipesByTags = function(args, callback){
	let output = {};

	let query = "SELECT "+columns.RECIPE_TAGS.RECIPE_ID+" AS 'id' FROM "+tables.RECIPE_TAGS+" WHERE "+columns.RECIPE_TAGS.TAG_ID+" IN ?";

	if(args.filter !== "whitelist"){
		query = "SELECT "+columns.RECIPE_TAGS.RECIPE_ID+" AS 'id' FROM "+tables.RECIPE_TAGS+" WHERE "+columns.RECIPE_TAGS.RECIPE_ID+" NOT IN ("+query+")";
		if(args.filter === "bw")
			query = query + " AND "+columns.RECIPE_TAGS.TAG_ID+" IN ?";
	}

	query = query + " GROUP BY "+columns.RECIPES.ID+" ORDER BY "+columns.RECIPES.ID;

	query = "SELECT r."+columns.RECIPES.ID+", r."+columns.RECIPES.NAME+" AS 'name' FROM "+tables.RECIPES+" r JOIN ("+query+") s ON r."+columns.RECIPES.ID+" = s.id";
	con.query(query, args.data, (err, result) =>{
		if(err){
			output = errHandler(err);
		} 
		else{
			output = result;
		}
		callback(output);
	});
}

module.exports.getIngredientsByTags = function(args, callback){
	let output = {};

	let query = "SELECT "+columns.INGREDIENT_TAGS.INGREDIENT_ID+" AS 'id' FROM "+tables.INGREDIENT_TAGS+" WHERE "+columns.INGREDIENT_TAGS.TAG_ID+" IN ?";

	if(args.filter !== "whitelist"){
		query = "SELECT "+columns.INGREDIENTE_TAGS.INGREDIENT_ID+" AS 'id' FROM "+tables.INGREDIENT_TAGS+" WHERE "+columns.INGREDIENT_TAGS.INGREDIENT_ID+" NOT IN ("+query+")";
		if(args.filter === "bw")
			query = query + " AND "+columns.INGREDIENT_TAGS.TAG_ID+" IN ?";
	}

	query = query + " GROUP BY "+columns.INGREDIENTS.ID+" ORDER BY "+columns.INGREDIENTS.ID;

	query = "SELECT r."+columns.INGREDIENTS.ID+", r."+columns.INGREDIENTS.NAME+" AS 'name' FROM "+tables.INGREDIENTS+" r JOIN ("+query+") s ON r."+columns.INGREDIENTS.ID+" = s.id";
	con.query(query, args.data, (err, result) =>{
		if(err){
			output = errHandler(err);
		} 
		else{
			output = result;
		}
		callback(output);
	});
}

module.exports.getRecipesByTagBW = function(blacklist, whitelist, callback){
	let output = {};
	const query = "SELECT r."+columns.RECIPES.ID+" as 'recipe', t."+columns.RECIPE_TAGS.TAG_ID+" as 'tag' "+
					"FROM "+tables.RECIPES+" r "+
					"JOIN "+tables.RECIPE_TAGS+" t "+
						"ON r."+columns.RECIPES.ID+" = t."+columns.RECIPE_TAGS.RECIPE_ID+" "+
					"WHERE r."+columns.RECIPES.ID+" NOT IN ? AND "+
							"r."+columns.RECIPES.ID+" IN ?";
	con.query(query, [[blacklist], [whitelist]], (err, result) =>{
		if(err){
			output = errHandler(err);
		} 
		else{
			output = result;
		}
		callback(output);
	});
}

module.exports.getIngredientsByTagFilter = function(selector, filter, callback){
	let output = {};
	let query = "SELECT r."+columns.RECIPES.ID+" as 'recipe', t."+columns.RECIPE_TAGS.TAG_ID+" as 'tag' "+
					"FROM "+tables.RECIPES+" r "+
					"JOIN "+tables.RECIPE_TAGS+" t "+
						"ON r."+columns.RECIPES.ID+" = t."+columns.RECIPE_TAGS.RECIPE_ID+" "+
					"WHERE r."+columns.RECIPES.ID;
	if(selector === "blacklist")
		query += " NOT";
	query += " IN ?";
	con.query(query, [[filter]], (err, result) =>{
		if(err){
			output = errHandler(err);
		} 
		else{
			output = result;
		}
		callback(output);
	});
}

module.exports.getIngredientsByTagBW = function(blacklist, whitelist, callback){
	let output = {};
	const query = "SELECT r."+columns.RECIPES.ID+" as 'recipe', t."+columns.RECIPE_TAGS.TAG_ID+" as 'tag' "+
					"FROM "+tables.RECIPES+" r "+
					"JOIN "+tables.RECIPE_TAGS+" t "+
						"ON r."+columns.RECIPES.ID+" = t."+columns.RECIPE_TAGS.RECIPE_ID+" "+
					"WHERE r."+columns.RECIPES.ID+" NOT IN ? AND "+
							"r."+columns.RECIPES.ID+" IN ?";
	con.query(query, [[blacklist], [whitelist]], (err, result) =>{
		if(err){
			output = errHandler(err);
		} 
		else{
			output = result;
		}
		callback(output);
	});
}

function del(table, col, data, callback){
	let query = "DELETE FROM "+table+" WHERE "+col+" = ?";
	con.query(query, [data], (err, result) => callback(deleteErrResultHandler(err, result)));
}

function deleteErrResultHandler(err, result){
	let output = {};
	if(err){
		output = errHandler(err);
	} else {
		output.code = resultEnum.SUCCESS.code;
		output.msg = resultEnum.SUCCESS.message;
		output.count = result.affectedRows;
	};
	return output;
}

function removeRecipeIngredients(recipeId, callback){
	del(tables.RECIPE_INGREDIENTS, columns.RECIPE_INGREDIENTS.RECIPE_ID, recipeId, callback);
}

function removeRecipeTags(recipeId, callback){
	del(tables.RECIPE_TAGS, columns.RECIPE_TAGS.RECIPE_ID, recipeId, callback);
}

function removeIngredientTags(ingredientId, callback){
	del(tables.INGREDIENT_TAGS, columns.INGREDIENT_TAGS.INGREDIENT_ID, ingredientId, callback);
}

function updateIngredient(input, callback){
	const data = {};
	data[columns.INGREDIENTS.NAME] = input.name;
	const selector = input.id;
	const selectorCol = columns.INGREDIENTS.ID;
	const table = tables.INGREDIENTS;
	update(table, data, selectorCol, selector, callback);
}

function update(table, data, selectorCol, selector, callback){
	const query = "UPDATE "+table+" SET ? WHERE "+selectorCol+" = ?";
	con.query(query, [data, selector], (err, result) => callback(updateErrResultHandler(err, result)));
}

function updateErrResultHandler(err, result){
	let output = {};
	if(err){
		output = errHandler(err);
	} else {
		output.code = resultEnum.SUCCESS.code;
		output.msg = resultEnum.SUCCESS.message;
		output.count = result.affectedRows;
	};
	return output;
}

module.exports.putIngredient = function(input,callback){
	let output = {};

	updateIngredient(input.ingredient, resultIngredient =>{
		output.ingredient = resultIngredient;

		if(resultIngredient.code === resultEnum.SUCCESS.code){
			removeIngredientTags(input.ingredient.id, result =>{
				writeIngredientTags(input.ingredient.id, input.tags, (result) => {
					output.tags = result
					callback(output);
				});
			});
		} else {
			callback(output);
		}
	});
}

function updateRecipe(input, callback){
	const data = {};
	data[columns.RECIPES.NAME] = input.name;
	data[columns.RECIPES.DESC] = input.description;
	data[columns.RECIPES.STEPS] = input.steps;
	const selector = input.id;
	const selectorCol = columns.RECIPES.ID;
	const table = tables.RECIPES;
	update(table, data, selectorCol, selector, callback);
}

module.exports.putRecipe = function(input, callback){
	let output = {};

	updateRecipe(input.recipe, resultRecipe =>{
		output.recipe = resultRecipe;

		if(resultRecipe.code === resultEnum.SUCCESS.code){
			async.parallel([
				function(asyncCallback){
					removeRecipeIngredients(input.recipe.id, result =>{
						writeRecipeIngredients(input.recipe.id, input.ingredients, (result) => asyncCallback(null, result));
					});
				},
				function(asyncCallback){
					removeRecipeTags(input.recipe.id, result =>{
						writeRecipeTags(input.recipe.id, input.tags, (result) => asyncCallback(null, result));
					});
				}],
				function(err, asyncResults){
					output.ing = asyncResults[0];
					output.tag = asyncResults[1];
					callback(output);
				}
			);
		} else {
			callback(output);
		}
	});
}

function updateTag(input, callback){
	const data = {};
	data[columns.TAGS.NAME] = input.name;
	const selector = input.id;
	const selectorCol = columns.TAGS.ID;
	const table = tables.TAGS;
	update(table, data, selectorCol, selector, callback);
}

module.exports.putTag = function(input, callback){
	let output = {}

	updateTag(input.tag, resultIngredient =>{
		output.tag = resultIngredient;
		callback(output);
	});
}

module.exports.getIngredientById = function(id, callback){
	let output = {};
	const query = "SELECT "+columns.INGREDIENTS.ID+", "+columns.INGREDIENTS.NAME+" as 'name' "+
					"FROM "+tables.INGREDIENTS+" "+
					"WHERE "+columns.INGREDIENTS.ID+" = ?";
	con.query(query, [[id]], (err, result) =>{
		if(err){
			output = errHandler(err);
		}
		else{
			output = result;
		}
		callback(output);
	});
}

module.exports.getIngredientsByName = function(name, callback){
	let output = {};
	const query = "SELECT "+columns.INGREDIENTS.ID+", "+columns.INGREDIENTS.NAME+" as 'name' "+
					"FROM "+tables.INGREDIENTS+" "+
					"WHERE "+columns.INGREDIENTS.NAME+" LIKE ?";
	let q = con.query(query, [["%"+name+"%"]], (err, result) =>{
		if(err){
			output = errHandler(err);
		}
		else{
			output = result;
		}
		callback(output);
	});
}

module.exports.getTagById = function(id, callback){
	let output = {};
	const query = "SELECT "+columns.TAGS.ID+", "+columns.TAGS.NAME+" as 'name' "+
					"FROM "+tables.TAGS+" "+
					"WHERE "+columns.TAGS.ID+" = ?";
	con.query(query, [[id]], (err, result) =>{
		if(err){
			output = errHandler(err);
		}
		else{
			output = result;
		}
		callback(output);
	});
}

module.exports.getTagsByName = function(name, callback){
	let output = {};
	const query = "SELECT "+columns.TAGS.ID+", "+columns.TAGS.NAME+" as 'name' "+
					"FROM "+tables.TAGS+" "+
					"WHERE "+columns.TAGS.NAME+" LIKE ?";
	let q = con.query(query, [["%"+name+"%"]], (err, result) =>{
		if(err){
			output = errHandler(err);
		}
		else{
			output = result;
		}
		callback(output);
	});
}

module.exports.getPubRecipeById = function(userId, id, callback){
	let output = {};
	const query = "SELECT "+columns.PUB_RECIPES.ID+", "+columns.PUB_RECIPES.VERSION+", "+columns.PUB_RECIPES.NAME+" as 'name', "+columns.PUB_RECIPES.DESC+" as 'description', "+columns.PUB_RECIPES.TIME+" as 'time', "+columns.PUB_RECIPES.SERVINGS+
					" FROM "+tables.PUB_RECIPES+" "+
					"WHERE "+columns.PUB_RECIPES.ID+" = ?";
	con.query(query, [[id]], (err, resultRecipe) =>{
		if(err){
			callback(errHandler(err));
		}
		else{
			output.recipe = resultRecipe[0];
			async.parallel([
				function(asyncCallback){
					getPubIngredientsByRecipeId(id, (result) => asyncCallback(null, result));
				},
				function(asyncCallback){
					getPubStepsByRecipeId(id, (result) => asyncCallback(null, result));
				},
				function(asyncCallback){
					isRecipeFavorited(id, userId, (result) => asyncCallback(null, result));
				},
				function(asyncCallback){
					getVotes(userId, id, (err, result) => asyncCallback(err, result));
				}],
				function(err, asyncResults){
					output.ing = asyncResults[0];
					output.steps = asyncResults[1];
					output.isFavorite = asyncResults[2];
					if(asyncResults[3]){
						output.recipe.upvotes = asyncResults[3].upvotes || 0;
						output.recipe.downvotes = asyncResults[3].downvotes || 0;
						if(asyncResults[3].vote)
							output.recipe.user_vote = asyncResults[3].vote;
					}
					else{
						output.recipe.upvotes = 0;
						output.recipe.downvotes = 0;
					}
					callback(null, output);
				}
			);
		}
	});
}

function getVotes(user, recipe, callback){
	if(user)
		getVotesForUser(user, recipe, callback);
	else
		getVotesNoAuth(recipe, callback);
}

function getVotesForUser(user, recipe, callback){
	let query = "SELECT (SELECT vote FROM pub_recipe_votes WHERE id_recipe = ? AND id_user = ?) vote, (SELECT count(vote) upvotes FROM pub_recipe_votes WHERE vote = 1 AND id_recipe = ?) upvotes, (SELECT count(vote) downvotes FROM pub_recipe_votes WHERE vote = -1 AND id_recipe = ?) downvotes";
	let q = con.query(query, [recipe, user, recipe, recipe], (err, result) => {
		callback(err, result[0]);
	});
}

function getVotesNoAuth(recipe, callback){
	let query = "SELECT (SELECT count(vote) upvotes FROM pub_recipe_votes WHERE vote = 1 AND id_recipe = ?) upvotes, (SELECT count(vote) downvotes FROM pub_recipe_votes WHERE vote = -1 AND id_recipe = ?) downvotes";
	con.query(query, [recipe, recipe], (err, result) => {
		callback(err, result[0]);
	});
}

module.exports.getVotesForUser = getVotesForUser;
module.exports.getVotesNoAuth = getVotesNoAuth;

function isRecipeFavorited(recipeId, userId, callback){
	if(userId == null){
		callback(false);
		return;
	}
	const query = "SELECT br.id_book FROM book_recipe br LEFT JOIN book b ON b.id = br.id_book WHERE b.id_owner = ? AND br.id_recipe = ? AND b.is_default = true";
	con.query(query, [userId, recipeId], (err, result) => {
		if(result.length > 0){
			callback(true);
			return;
		}
		else callback(false);
	});
}

function getPubIngredientsByRecipeId(id, callback){
	let output = {};
	const query = "SELECT "+columns.PUB_RECIPE_INGREDIENTS.ID+", "+columns.PUB_RECIPE_INGREDIENTS.POSITION+", "+columns.PUB_RECIPE_INGREDIENTS.TEXT+ " as text "+
					"FROM "+tables.PUB_RECIPE_INGREDIENTS+" "+
					"WHERE "+columns.PUB_RECIPE_INGREDIENTS.RECIPE_ID+" = ?";
	let q = con.query(query, [[id]], (err, result) =>{
		if(err){
			output = errHandler(err);
		}
		else{
			output = result;
		}
		callback(output);
	});
}

function getPubStepsByRecipeId(id, callback){
	let output = {};
	const query = "SELECT "+columns.PUB_RECIPE_STEPS.ID+", "+columns.PUB_RECIPE_STEPS.POSITION+", "+columns.PUB_RECIPE_STEPS.TEXT+ " as text "+
					"FROM "+tables.PUB_RECIPE_STEPS+" "+
					"WHERE "+columns.PUB_RECIPE_STEPS.RECIPE_ID+" = ?";
	con.query(query, [[id]], (err, result) =>{
		if(err){
			output = errHandler(err);
		}
		else{
			output = result;
		}
		callback(output);
	});
}

module.exports.putRecipe = function(input, callback){
	let output = {};

	updateRecipe(input.recipe, resultRecipe =>{
		output.recipe = resultRecipe;

		if(resultRecipe.code === resultEnum.SUCCESS.code){
			async.parallel([
				function(asyncCallback){
					removeRecipeIngredients(input.recipe.id, result =>{
						writeRecipeIngredients(input.recipe.id, input.ingredients, (result) => asyncCallback(null, result));
					});
				},
				function(asyncCallback){
					removeRecipeTags(input.recipe.id, result =>{
						writeRecipeTags(input.recipe.id, input.tags, (result) => asyncCallback(null, result));
					});
				}],
				function(err, asyncResults){
					output.ing = asyncResults[0];
					output.tag = asyncResults[1];
					callback(output);
				}
			);
		} else {
			callback(output);
		}
	});
}

module.exports.getPubRecipesByName = function(name, callback){
	let output = {};
	const query = "SELECT "+columns.PUB_RECIPES.ID+", "+columns.PUB_RECIPES.NAME+" as 'name'"+
					" FROM "+tables.PUB_RECIPES+" "+
					" WHERE "+columns.PUB_RECIPES.NAME+" LIKE ?";
	con.query(query, [["%"+name+"%"]], (err, result) =>{
		if(err){
			output = errHandler(err);
		}
		else{
			output = result;
		}
		callback(output);
	});
}

module.exports.searchRecipes = (params, callback) => {
	let output = {};
	let finalQuery = "SELECT r.id, r.recipe_name FROM recipe r ";
	let data = [];

	if(params.blacklistIngredients||params.blacklistTags||params.whitelistTags){

		query = "SELECT id_recipe AS id FROM recipe_ingredients WHERE ";
		filters = 0;

		if (params.blacklistIngredients){
			filters++;	
			userIngredientBlacklist = "SELECT id_ingredient FROM user_ingredient_blacklist WHERE id_user = ?";
			recipesWithBlacklistIngredients = "SELECT id_recipe FROM recipe_ingredients WHERE id_ingredients IN ("+userIngredientBlacklist+") GROUP BY id_recipe";
			recipeIngredientBlacklistFilter = "id_recipe NOT IN ("+recipesWithBlacklistIngredients+") ";
			query = query + recipeIngredientBlacklistFilter;
			data.push(params.userId);
		}
		if (params.blacklistTags){
			if (filters > 0)
				query = query + "AND ";
			filters++;
			userTagBlacklist = "SELECT id_tag FROM user_tag_blacklist WHERE id_user = ?";
			recipesWithBlacklistTags = "SELECT id_recipe FROM recipe_tags WHERE id_tags IN ("+userTagBlacklist+") GROUP BY id_recipe";
			recipeTagBlacklistFilter = "id_recipe NOT IN ("+recipesWithBlacklistTags+") ";
			query = query + recipeTagBlacklistFilter;
			data.push(params.userId);
		}
		if (params.whitelistTags){
			if (filters > 0)
				query = query + "AND ";
			filters++;
			userTagWhitelist = "SELECT id_tag FROM user_tag_whitelist WHERE id_user = ?";
			recipesWithWhitelistTags = "SELECT id_recipe FROM recipe_tags WHERE id_tags IN ("+userTagWhitelist+") GROUP BY id_recipe";
			recipeTagWhitelistFilter = "id_recipe IN ("+recipesWithWhitelistTags+") ";
			query = query + recipeTagWhitelistFilter;
			data.push(params.userId);
		}
		query = query + "GROUP BY id_recipe";
		finalQuery = finalQuery + "INNER JOIN ("+query+") q ON r.id = q.id ";
	}

	if(params.str || params.duration){
		query = "WHERE ";
		filters = 0;
		if(params.str){
			filters++;
			query = query + "(r.recipe_name LIKE ?";
			data.push("%"+params.str+"%");
			if(params.description){
				query = query + " OR r.recipe_description LIKE ?";
				data.push("%"+params.str+"%");
			}
			query = query + ") ";
		}
		if(params.duration){
			if (filters > 0)
				query = query + "AND ";
			filters++;
			query = query + "r.duration_minutes < ? ";
			data.push(params.duration);
		}
		finalQuery = finalQuery + query;
	}

	con.query(finalQuery, data, (err, result) => {
		callback(err, result);
	});
}

module.exports.updateDietType = (user, diet, callback) => {
	const query = "UPDATE users SET diet_type = ? WHERE id = ?"
	con.query(query, [diet, user], (err, result) => {
		clearWeekRecipes(user, () => {
			callback(err, result);
		});
	});
}

module.exports.addBlacklistedTag = (user, tag, callback) => {
	const query = "INSERT INTO user_tag_blacklist (id_user, id_tag) VALUES (?, ?)"
	con.query(query, [user, tag], (err, result) => {
		clearWeekRecipes(user, () => {
			callback(err, result);
		});
	});
}

module.exports.removeBlacklistedTag = (user, tag, callback) => {
	const query = "DELETE FROM user_tag_blacklist WHERE (id_user = ?) and (id_tag = ?)"
	con.query(query, [user, tag], (err, result) => {
		clearWeekRecipes(user, () => {
			callback(err, result);
		});
	});
}

module.exports.getUserBlacklistedTags = (user, callback) => {
	const query = "SELECT bl.id_tag, t.tag_name FROM user_tag_blacklist bl LEFT JOIN tags t ON bl.id_tag = t.id WHERE bl.id_user = ?"
	con.query(query, [user], (err, result) => {
		callback(err, result);
	});
}

module.exports.getDietType = (user, callback) => {
	const query = "SELECT diet_type FROM users WHERE id = ?"
	con.query(query, [user], (err, result) => {
		callback(err, result);
	});
}

module.exports.getUserBooksBasic = (user, callback) => {
	const query = "SELECT book_name, id FROM book WHERE id_owner = ? ORDER BY is_default DESC, book_name ASC"
	con.query(query, [user], (err, result) => {
		callback(err, result);
	});
}

module.exports.createBookmark = (book, recipe, callback) => {
	const query = "INSERT INTO book_recipe (id_book, id_recipe) VALUES (?, ?) ON DUPLICATE KEY UPDATE date_added = CURRENT_TIMESTAMP"
	con.query(query, [book, recipe], (err, result) => {
		callback(err, result);
	});
}

module.exports.createBook = (user, book, recipe, callback) => {
	const querySelect = "SELECT id FROM book WHERE book_name = ? AND id_owner = ?";
	const queryCreateBook = "INSERT INTO book (book_name, id_owner) VALUES (?, ?)";

	con.query(querySelect, [book, user], (err, result) => {
		if(err == null && result.length == 0)//doesn't exist
			con.query(queryCreateBook, [book, user], (err, result) => {
				this.createBookmark(result.insertId, recipe, (err, result) => {
					callback();
				})
			});
		else if(err == null)//book found
			this.createBookmark(result[0].id, recipe, (err, result) => {
				callback();
			})
	});
}

module.exports.removeFavorite = (user, recipe, callback) => {
	const queryFindFavorite = "SELECT id FROM book WHERE id_owner = ? AND is_default = 1";
	const queryDelete = "DELETE FROM book_recipe WHERE id_book = ? and id_recipe = ?";

	con.query(queryFindFavorite, [user], (err, result) => {
		if(err == null)//book found
			con.query(queryDelete, [result[0].id, recipe], (err, result) => {
				callback();
			})
	});
}

module.exports.getUserBooksDetailed = (user, ownedBooks, callback) => {

	let hideEmptyBooks = false;

	if(ownedBooks){
		let query = "SELECT b.id, b.book_name name, count(br.id_recipe) recipe_count, "
						+"CASE WHEN f.followers IS NULL THEN 0 "
							+"ELSE f.followers END followers, "
						+"CASE WHEN br.id_recipe IS NULL "
							+"THEN NULL "
							+"ELSE CONCAT(\"[\", SUBSTRING_INDEX(GROUP_CONCAT(\"{\"\"id\"\":\", br.id_recipe, \", \"\"name\"\":\"\"\", r.recipe_name, \"\"\"}\"), \",{\", 3), \"]\") END highlights "
						+"FROM book b "
    					+"LEFT JOIN book_recipe br ON b.id = br.id_book "
    					+"LEFT JOIN pub_recipe r ON br.id_recipe = r.id "
    					+"LEFT JOIN (SELECT count(*) followers, id_book FROM follow GROUP BY id_book) f ON f.id_book = b.id "
    					+"WHERE id_owner = ? "
    					+"GROUP BY b.id ";
    	if(hideEmptyBooks)
	    	query = query + "HAVING count(br.id_recipe) > 0 ";
    	query = query + "ORDER BY is_default DESC, book_name ASC";
		con.query(query, [user], (err, result) => {
			for(i = 0; i < result.length; i++){
				if (result[i].highlights != null){
					result[i].highlights = JSON.parse(result[i].highlights);
				}
			}
			callback(err, result);
		});
	}
}

module.exports.getBookDetails = (book, callback) => {
	const query = "SELECT b.id, b.id_owner owner, u.display_name owner_name, b.book_name name, b.is_default is_default, CASE WHEN r.id IS NULL THEN NULL ELSE CONCAT(\"[\", GROUP_CONCAT(\"{\"\"id\"\":\", r.id, \", \"\"name\"\":\"\"\", r.recipe_name, \"\"\"}\"), \"]\") END recipes FROM book b LEFT JOIN book_recipe br ON b.id = br.id_book LEFT JOIN pub_recipe r ON br.id_recipe = r.id LEFT JOIN users u ON b.id_owner = u.id WHERE b.id = ? GROUP BY b.id";
	con.query(query, [book], (err, result) => {
		for(i = 0; i < result.length; i++){
			if (result[i].recipes != null){
				result[i].recipes = JSON.parse(result[i].recipes);
			}
		}
		callback(err, result);
	});
}

module.exports.removeRecipeFromBook = (book, recipe, callback) => {
	const query = "DELETE FROM book_recipe WHERE (id_book = ?) and (id_recipe = ?)";
	con.query(query, [book, recipe], (err, result) => {
		callback(err, result);
	});
}

module.exports.updateBookName = (name, id, callback) => {
	const query = "UPDATE book SET book_name = ? WHERE (id = ?)";
	con.query(query, [name, id], (err, result) => {
		callback(err, result);
	});
}

module.exports.deleteBook = (book, callback) => {
	const queryRecipes = "DELETE FROM book_recipe WHERE (id_book = ?)";
	const queryBook = "DELETE FROM book WHERE id = ?";
	let q = con.query(queryRecipes, [book], (a, b) => {
		con.query(queryBook, [book], (err, result) => {
			callback(err, result);
		})
	});
}

module.exports.getFilteredRecipes = (user_id, params, callback) =>{
	let search_str = params.search_str == undefined ? null : params.search_str;
	let use_ingredient_blacklist = params.use_ingredient_blacklist == undefined ? null : !!params.use_ingredient_blacklist;
	let use_tag_blacklist = params.use_tag_blacklist == undefined ? null : !!params.use_tag_blacklist;
	let use_diet_whitelist = params.use_diet_whitelist == undefined ? null : !!params.use_diet_whitelist;
	let max_results = params.max_results == undefined ? null : params.max_results;
	let whitelisted_tag = params.whitelisted_tag == undefined ? null : params.whitelisted_tag;
	let sort_order = params.sort_order == undefined ? null : params.sort_order;
	let ignore_downvoted = params.ignore_downvoted == undefined ? null : !!params.ignore_downvoted;
	let prep_time = params.prep_time == undefined ? null : params.prep_time;

	let meal_whitelist_array = null;
	if(params.meal_whitelist_array){
		meal_whitelist_array = params.meal_whitelist_array[0];
		for(i = 1; i < params.meal_whitelist_array.length; i++){
			meal_whitelist_array = meal_whitelist_array + "," + params.meal_whitelist_array[i];
		}
	}

	const query = "CALL GetFilteredRecipes(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
	let q = con.query(query, [search_str, user_id, use_diet_whitelist, use_ingredient_blacklist, use_tag_blacklist, whitelisted_tag, meal_whitelist_array, max_results, sort_order, ignore_downvoted, prep_time], (err, result) => {
		callback(err, result);
	});
}


module.exports.getWeekRecipes = (count, user_id, callback) => {
	let today = new Date().toISOString().slice(0, 10);

	const queryGetCurrentMeals = "SELECT pr.recipe_name, uws.id_recipe, uws.id_meal, uws.day_of_week FROM user_week_suggestions uws LEFT JOIN pub_recipe pr ON pr.id = uws.id_recipe WHERE uws.week_monday = DATE(SUBDATE('"+today+"', WEEKDAY('"+today+"'))) AND uws.id_user = ?";
	con.query(queryGetCurrentMeals, [user_id], (err, initialWeekArray) => {
		if(initialWeekArray.length == 21){
			callback(err, initialWeekArray);
		}
		else{

			let missingMealGrid = [[],[],[]];

			for(i = 0; i < 3; i++){	
				for(j = 0; j < 7; j++){
					missingMealGrid[i].push(j+1);
				}
			}

			for(i = 0; i < initialWeekArray.length; i++){
				let index = missingMealGrid[initialWeekArray[i].id_meal-1].indexOf(initialWeekArray[i].day_of_week);
				if(index > -1)
					missingMealGrid[initialWeekArray[i].id_meal-1].splice(index, 1);
			}


			insertArray = [];
			async.parallel([(asyncCallback)=>{
					getMissingRecipes(user_id, "1", missingMealGrid[0].length, asyncCallback);
				},
				(asyncCallback)=>{
					getMissingRecipes(user_id, "2", missingMealGrid[1].length, asyncCallback);
				},
				(asyncCallback)=>{
					getMissingRecipes(user_id, "3", missingMealGrid[2].length, asyncCallback);
				}
				],
				(err, asyncResults)=>{
					console.log(err);
					for(i = 0; i < 3; i++){
						for(j = 0; j < asyncResults[i].length; j++){
							insertArray.push([user_id, asyncResults[i][j].id, (i+1), missingMealGrid[i][j]]);
						}
					}
					con.query("INSERT INTO user_week_suggestions(id_user, id_recipe, id_meal, day_of_week) VALUES ?", [insertArray], (err, result)=>{
						if(count < 8)
							this.getWeekRecipes(count+1, user_id, callback);
						else{
							callback("No recipes found");
						}
					});
				});
		}
	});
}

function clearWeekRecipes(user_id, callback){
	const query = "DELETE FROM user_week_suggestions WHERE id_user = ? AND DATEDIFF(CURDATE(), week_monday) < 7";
	con.query(query, user_id, (err, result) => {
		if(err)
			console.log(err);
		callback(err, result)
	});
}

function getMissingRecipes(user, meal, max, callback){
	if(max == 0){
		callback(null, []);
		return;
	}
	let query = "CALL GetFilteredRecipes(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
	let q = con.query(query, [null, user, true, true, true, null, meal, max, 1, true, null], (err, result) => {
		callback(err, result[0]);
	});

}

module.exports.getRecipeComments = (recipe, callback) => {
	let query = "WITH RECURSIVE cte (id, id_recipe, id_parent, content, id_user, creation_timestamp) AS ( "+
					"SELECT id, id_recipe, id_parent, content, id_user, creation_timestamp "+
					"FROM pub_recipe_comment "+
					"WHERE id_recipe = ? AND id_parent = 0 "+
					"UNION ALL "+
					"SELECT c.id, c.id_recipe, c.id_parent, c.content, c.id_user, c.creation_timestamp "+
					"FROM pub_recipe_comment c "+
					"INNER JOIN cte "+
						"ON c.id_parent = cte.id) "+
					"SELECT c.id, c.id_parent, c.content, u.display_name, c.creation_timestamp FROM cte c JOIN users u ON c.id_user = u.id ORDER BY c.id_parent, c.creation_timestamp DESC";
	con.query(query, [recipe], (err, result) => {
		callback(err, result);
	});
}


module.exports.createComment = (user, parent, recipe, content, callback) => {
	let query = "INSERT INTO pub_recipe_comment (id_recipe, id_parent, content, id_user) VALUES (?, ?, ?, ?)";
	con.query(query, [recipe, parent, content, user], (err, result) => {
		callback(err, result);
	});
}

module.exports.voteOnRecipe = (user, recipe, vote, callback) => {
	let query = "INSERT INTO pub_recipe_votes(id_recipe, id_user, vote) VALUES(?, ?, ?) ON DUPLICATE KEY UPDATE vote = ?";
	con.query(query, [recipe, user, vote, vote], (err, result) => {
		if(result){
			getVotesForUser(user, recipe, callback);
		}
	});
}

module.exports.createTicket = (user, title, message, callback) => {
	let query = "INSERT INTO ticket_threads(id_user, thread_title) VALUES(?, ?)";
	con.query(query, [user, title], (err, result) => {
		if(err){
			console.log(err);
			return;
		}
		query = "INSERT INTO ticket_messages(id_thread, id_user, message) VALUES(?, ?, ?)";
		con.query(query, [result.insertId, user, message], (err, result) => callback(err, result));
	});
}

module.exports.createTicketReply = (thread, user, message, callback) => {
	async.parallel({
		thread: (callback) => {
			let query = "UPDATE ticket_threads SET current_status = 0 WHERE id = ?";
			con.query(query, [thread], (err, result) => callback(err, result));
		},
		messages: (callback) => {
			let query = "INSERT INTO ticket_messages(id_thread, id_user, message) VALUES(?, ?, ?)";
			con.query(query, [thread, user, message], (err, result) => callback(err, result));
		}
	},
	(err, results) => {
		callback(err, results);
	})
}

module.exports.getUserTickets = (user, callback) => {
	let query = "SELECT id, thread_title, submit_date, current_status FROM ticket_threads WHERE id_user = ? ORDER BY submit_date DESC";
	con.query(query, [user], (err, result) => callback(err, result));
}

module.exports.getTicketMessages = (thread, callback) => {
	async.parallel({
		thread: (callback) => {
			let query = "SELECT thread_title, current_status FROM ticket_threads WHERE id = ?";
			con.query(query, [thread], (err, result) => callback(err, result));
		},
		messages: (callback) => {
			let query = "SELECT u.display_name, m.submit_date, m.message FROM ticket_messages m LEFT JOIN users u ON u.id = m.id_user WHERE m.id_thread = ? ORDER BY m.submit_date ASC";
			con.query(query, [thread], (err, result) => callback(err, result));
		}
	},
	(err, results) => {
		callback(err, results);
	})
}

module.exports.closeTicket = (thread, wasSolved, callback) => {
	let query = "UPDATE ticket_threads SET current_status = 2, problem_solved = ? WHERE id = ?";
	con.query(query, [wasSolved, thread], (err, result) => {
		callback(err, result);
	});
	
}


module.exports.newSuggestion = (user, title, message, callback) => {
	let query = "INSERT INTO suggestions(id_user, title, message) VALUES(?, ?, ?)";
	con.query(query, [user, title, message], (err, result) => {
		callback(err, result);
	});
	
}

module.exports.getCategories = (callback) => {
	async.parallel({
		meals: callback => {
			let query = "SELECT * FROM meals";
			con.query(query, (err, result) => callback(err, result));
		},
		diets: callback => {
			let query = "SELECT * FROM diets";
			con.query(query, (err, result) => callback(err, result));
		}
	},
	(err, results) => {
		if(err == null)
			callback(err, results);
		else
			console.log(err);
	})
}


module.exports.getSearchResults = (user_id, params, callback) =>{
	console.log(user_id, params);
	let search_str = params.search_str;
	let diet = params.diet;
	let meal = params.meal;
	let filterRestrictions = !!params.filterRestrictions;
	let filterDownvotes = !!params.filterDownvotes;
	let prepTime = params.prepTime;

	const query = "CALL AdvancedSearch(?, ?, ?, ?, ?, ?, ?);"
	let q = con.query(query, [user_id, search_str, diet, meal, filterRestrictions, filterDownvotes, prepTime], (err, result) => {
		console.log(err, result); 
		callback(err, result[0]);
	});
}