/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

exports.up = async function up(knex) {
  await knex.schema.createTable('chat_sessions', table => {
    table.string('session_id').primary();
    table.string('agent').notNullable();
    table.string('principal').notNullable();
    table.timestamp('created').notNullable().defaultTo(knex.fn.now());
    table.timestamp('ended');
    table.timestamp('last_activity').notNullable().defaultTo(knex.fn.now());

    table.index(['principal'], 'chat_sessions_principal_idx');
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTable('chat_sessions');
};
