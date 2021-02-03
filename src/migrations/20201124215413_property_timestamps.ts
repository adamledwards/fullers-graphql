import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("property", (property_image) => {
    property_image.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("property", (property_image) => {
    property_image.dropTimestamps();
  });
}
