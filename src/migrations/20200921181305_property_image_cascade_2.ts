import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("property_image", (property_image) => {
    property_image.dropForeign(["propertyId"]);

    property_image
      .foreign("propertyId")
      .references("property.id")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("property_image", (property_image) => {
    property_image.dropForeign(["propertyId"]);

    property_image
      .foreign("propertyId")
      .references("id")
      .inTable("property")
      .onDelete("CASCADE");
  });
}
