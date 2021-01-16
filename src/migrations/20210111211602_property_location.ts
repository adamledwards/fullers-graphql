import * as Knex from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("property", (property) => {
    property.specificType('geolocation', 'point')
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("property", (property) => {
    property.dropColumn("geolocation");
  });


}
