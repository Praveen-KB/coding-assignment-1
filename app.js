const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const { format, isValid } = require("date-fns");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

function convert(dbobject) {
  return {
    id: dbobject.id,
    todo: dbobject.todo,
    category: dbobject.category,
    priority: dbobject.priority,
    status: dbobject.status,
    dueDate: dbobject.due_date,
  };
}

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};
const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case hasCategoryAndPriority(request.query):
      getTodosQuery = `
        SELECT *
        FROM todo
        WHERE
        todo like "%${search_q}%"
        AND category = "${category}"
        AND priority = "${priority}"
        `;
      break;
    case hasCategoryAndStatus(request.query): {
      getTodosQuery = `
        SELECT *
        FROM todo
        WHERE
        todo like "%${search_q}%"
        AND category = "${category}"
        AND status = "${status}"
        `;
      break;
    }

    case hasCategory(request.query): {
      getTodosQuery = `
        SELECT *
        FROM todo
        WHERE
        todo like "%${search_q}%"
        AND category = "${category}"
        `;
      break;
    }
    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }

  data = await database.all(getTodosQuery);
  response.send(data.forEach((each) => convert(each)));
});

app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const query = `
    SELECT *
    FROM todo
    WHERE id = ${todoId}
    `;
  const data = await database.get(query);
  response.send(convert(data));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const dateSplit = date.split("-");
  const requireDate = format(
    new Date(dateSplit[0], dateSplit[1] - 1, dateSplit[2]),
    "yyyy-MM-dd"
  );

  console.log(typeof requireDate);
  const quer = `
    SELECT *
    FROM todo
    WHERE strftime("%Y-%m-%d",due_date) = ${requireDate};
    `;
  const data = await database.all(quer);
  response.send(data.forEach((each) => convert(each)));
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const postTodoQuery = `
  INSERT INTO
    todo (id, todo, priority, status,category,due_date)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}' ,'${category}',${dueDate});`;
  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

module.exports = app;
