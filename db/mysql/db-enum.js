module.exports.tables = {
	RECIPES: "recipe",
	INGREDIENTS: "ingredients",
	TAGS: "tags",
	RECIPE_INGREDIENTS: "recipe_ingredients",
	RECIPE_TAGS: "recipe_tags",
	INGREDIENT_TAGS: "ingredients_tags",
	PUB_RECIPES: "pub_recipe",
	PUB_RECIPE_INGREDIENTS: "pub_recipe_ingredients",
	PUB_RECIPE_STEPS: "pub_recipe_steps"
}

module.exports.cols = {
	RECIPES: {
		TABLE: "recipe",
		ID: "id",
		NAME: "recipe_name",
		DESC: "recipe_description",
		STEPS: "steps"
	},
	INGREDIENTS:{
		TABLE: "ingredients",
		ID: "id",
		NAME: "ing_name"
	},
	TAGS: {
		TABLE: "tags",
		ID: "id",
		NAME: "tag_name"
	},
	RECIPE_INGREDIENTS: {
		TABLE: "recipe_ingredients",
		RECIPE_ID: "id_recipe",
		INGREDIENT_ID: "id_ingredients",
		UNIT_ID: "id_unit",
		AMOUNT: "amount",
		PREP: "id_preparation"
	},
	RECIPE_TAGS: {
		TABLE: "recipe_tags",
		RECIPE_ID: "id_recipe",
		TAG_ID: "id_tags"
	},
	INGREDIENT_TAGS: {
		TABLE: "ingredient_tags",
		INGREDIENT_ID: "id_ingredients",
		TAG_ID: "id_tags"
	},
	PUB_RECIPES:{
		TABLE: "pub_recipe",
		ID: "id",
		RECIPE_ID: "id_recipe",
		NAME: "recipe_name",
		VERSION: "version",
		DESC: "recipe_description",
		TIME: "duration",
		SERVINGS: "servings",
		LIKES: "likes"
	},
	PUB_RECIPE_INGREDIENTS:{
		ID: "id",
		RECIPE_ID: "id_recipe",
		POSITION: "position",
		TEXT: "content",
		HAS_SUB: "has_sub"
	},
	PUB_SUBRECIPE_INGREDIENTS:{
		ID: "id",
		PARENT_ID: "id_recipe_ingredient",
		POSITION: "position",
		TEXT: "content"
	},
	PUB_RECIPE_STEPS:{
		ID: "id",
		RECIPE_ID: "id_recipe",
		POSITION: "position",
		TEXT: "content",
		HAS_SUB: "has_sub"
	},
	PUB_SUBRECIPE_STEPS:{
		ID: "id",
		PARENT_ID: "id_recipe_step",
		POSITION: "position",
		TEXT: "content"
	}
}