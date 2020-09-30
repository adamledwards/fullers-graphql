import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("property_image", (property_image) => {
    property_image.integer("order").defaultTo(0).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("property_image", (property_image) => {
    property_image.dropColumn("order");
  });
}
