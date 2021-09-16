exports.parse = function(arg){
	return arg
	return JSON.parse(JSON.stringify(arg))
}


/*
expects json request body describing recipe. translates to dao format

current expected request body:
{
	"name": "recipe name",
	"desc": "recipe description",
	"steps": "recipe steps",
	"ings": [
		{"id": 1, "amount": 100, "unit": 1, "prep": 1}, 
		{"id": 2, "amount": 200, "unit": 2, "prep": 2}
	],
	"tags": [
		{"id": 1}, 
		{"id": 2}
	]
}

current expected DAO json:
{
	"recipe": {
		"name": "recipe name",
		"description": "recipe description",
		"steps": "recipe steps"
	},
	"ingredients":[
		{"id": 1, "amount": 100, "unit": 1},
		{"id": 2, "amount": 200, "unit": 2}
	],
	"tags": [
		{"id": 1}, 
		{"id": 2}
	]
}
*/

exports.parseWriteRecipe = function(input){
	const output = {};
	const recipe = {};
	recipe.name = input.name;
	recipe.description = input.desc;
	recipe.steps = input.steps;
	output.recipe = recipe;

	const ingredients = [];
	input.ings.forEach(ing =>{
		ingredient = {};
		ingredient.id = ing.id;
		ingredient.amount = ing.amount;
		ingredient.unit = ing.unit;
		ingredients.push(ingredient);
	});
	output.ingredients = ingredients;

	const tags = [];
	input.tags.forEach(tag =>{
		tags.push({"id":tag.id});
	})
	output.tags = tags;

	return output;
}

/*
expects json request body describing ingredient. translates to dao format

current expected request body:
{
	"name": "ingredient name",
	"tags": [
		{"id": 1}, 
		{"id": 2}
	]
}

current expected DAO json:
{
	"ingredient": {"name": "ingredient name"},
	"tags": [
		{"id": 1}, 
		{"id": 2}
	]
}
*/

exports.parseWriteIngredient = function(input){
	const output = {};
	const ingredient = {};
	ingredient.name = input.name;
	output.ingredient = ingredient;

	const tags = [];
	input.tags.forEach(tag =>{
		tags.push({"id": tag.id});
	});
	output.tags = tags;
	return output;
}

/*
expects json request body describing tag. translates to dao format

current expected request body:
{
	"name": "tag name"
}

current expected DAO json:
{
	"tag":{name": "tag name"}
}
*/

exports.parseWriteTag = function(input){
	const output = {};
	const tag = {};
	tag.name = input.name;
	output.tag = tag;
	return output;
}

/*
expects json request body describing ingredient. translates to dao format

current expected request body:
{
	"id": 1
	"name": "ingredient name",
	"tags": [
		{"id": 1}, 
		{"id": 2}
	]
}

current expected DAO json:
{
	"ingredient": {"id": 1, "name": "ingredient name"},
	"tags": [
		{"id": 1}, 
		{"id": 2}
	]
}
*/

exports.parseUpdateIngredient = function(input){
	const output = {};
	const ingredient = {};
	ingredient.id = input.id;
	ingredient.name = input.name;
	output.ingredient = ingredient;

	const tags = [];
	input.tags.forEach(tag =>{
		tags.push({"id": tag.id});
	});
	output.tags = tags;
	return output;
}

/*
expects json request body describing recipe. translates to dao format

current expected request body:
{
	"id": 1
	"name": "recipe name",
	"desc": "recipe description",
	"steps": "recipe steps",
	"ings": [
		{"id": 1, "amount": 100, "unit": 1, "prep": 1}, 
		{"id": 2, "amount": 200, "unit": 2, "prep": 2}
	],
	"tags": [
		{"id": 1}, 
		{"id": 2}
	]
}

current expected DAO json:
{
	"recipe": {
		"id": 1
		"name": "recipe name",
		"description": "recipe description",
		"steps": "recipe steps"
	},
	"ingredients":[
		{"id": 1, "amount": 100, "unit": 1},
		{"id": 2, "amount": 200, "unit": 2}
	],
	"tags": [
		{"id": 1}, 
		{"id": 2}
	]
}
*/

exports.parseUpdateRecipe = function(input){
	const output = {};
	const recipe = {};
	recipe.id = input.id;
	recipe.name = input.name;
	recipe.description = input.desc;
	recipe.steps = input.steps;
	output.recipe = recipe;

	const ingredients = [];
	input.ings.forEach(ing =>{
		ingredient = {};
		ingredient.id = ing.id;
		ingredient.amount = ing.amount;
		ingredient.unit = ing.unit;
		ingredients.push(ingredient);
	});
	output.ingredients = ingredients;

	const tags = [];
	input.tags.forEach(tag =>{
		tags.push({"id":tag.id});
	})
	output.tags = tags;
	return output;
}

/*
expects json request body describing tag. translates to dao format

current expected request body:
{
	"id": 1
	"name": "tag name",
}

current expected DAO json:
{
	"tag": {"id": 1, "name": "tag name"}
}
*/

exports.parseUpdateTag = function(input){
	const output = {};
	output.tag = {"id": input.id, "name": input.name};
	return output;
}