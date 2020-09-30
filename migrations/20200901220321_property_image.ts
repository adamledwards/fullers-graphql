import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("property_image", (property_image) => {
    property_image.increments("id").primary();
    property_image.string("filepath", 255).notNullable();
    property_image.string("original", 255).notNullable();
    property_image.string("mimetype", 255).notNullable();
    property_image.string("encoding", 255).notNullable();
    property_image.integer("processingStatus").notNullable();
    property_image.string("description", 255).notNullable();
    property_image.integer("propertyId").notNullable();
    property_image
      .foreign("propertyId")
      .references("id")
      .inTable("property")
      .onDelete("NO ACTION");
    property_image.index("propertyId");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("property_image");
}
