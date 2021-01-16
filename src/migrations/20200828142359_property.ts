import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("property", (table) => {
    table.increments("id");
    table.string("addressLine1", 255).notNullable();
    table.string("addressLine2", 255).nullable();
    table.string("town", 255).nullable();
    table.string("postcode", 10).notNullable();

    table.boolean("isLetting").notNullable();

    table.integer("propertyType").defaultTo(0);

    table.boolean("isActive").defaultTo(false);

    table.integer("price").nullable();
    table.string("priceStatus", 255).nullable();

    table.integer("propertyStatus").defaultTo(0);
    table.integer("ownership").defaultTo(0);

    table.integer("bedroom").defaultTo(0);
    table.integer("bathroom").defaultTo(0);
    table.integer("reception").defaultTo(0);

    table.text("description").notNullable();
    table.json("keyFeatures").defaultTo([]);
    
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("property");
}
