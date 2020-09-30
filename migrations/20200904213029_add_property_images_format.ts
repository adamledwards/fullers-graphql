import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    create type format as (  
        mimetype VARCHAR(100),
        path text
    );
    `);
  await knex.schema.alterTable("property_image", (property_image) => {
    property_image.specificType("format", "format ARRAY");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("property_image", (property_image) => {
    property_image.dropColumn("format");
  });

  await knex.schema.raw(`
    drop type format;
    `);
}
