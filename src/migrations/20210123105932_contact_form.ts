import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("message", (table) => {
    table.increments("id");
    table.timestamps(true, true);
    table.string("firstName", 255).notNullable();
    table.string("lastName", 255).notNullable();

    table.string("email", 255).nullable();
    table.text("subject").nullable();
    table.text("message", "longtext").nullable();
    table.string("telephone", 255).nullable();

    table.string("addressLine1", 255).nullable();
    table.string("addressLine2", 255).nullable();
    table.string("town", 255).nullable();
    table.string("postcode", 10).nullable();

    table.integer("formType").notNullable();

    table.boolean("read").defaultTo(false);
    table.integer("propertyId").nullable();
    table
      .foreign("propertyId")
      .references("id")
      .inTable("property")
      .onDelete("NO ACTION")
      
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("message");
}
