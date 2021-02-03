import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("property_image", (property_image) => {
    property_image.boolean("isFloorPlans").defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("property_image", (property_image) => {
    property_image.dropColumns("isFloorPlans");
  });
}
