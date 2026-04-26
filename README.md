# nosql_template


## Предварительная проверка заданий

<a href=" ./../../../actions/workflows/1_helloworld.yml" >![1. Согласована и сформулирована тема курсовой]( ./../../actions/workflows/1_helloworld.yml/badge.svg)</a>

<a href=" ./../../../actions/workflows/2_usecase.yml" >![2. Usecase]( ./../../actions/workflows/2_usecase.yml/badge.svg)</a>

<a href=" ./../../../actions/workflows/3_data_model.yml" >![3. Модель данных]( ./../../actions/workflows/3_data_model.yml/badge.svg)</a>

<a href=" ./../../../actions/workflows/4_prototype_store_and_view.yml" >![4. Прототип хранение и представление]( ./../../actions/workflows/4_prototype_store_and_view.yml/badge.svg)</a>

<a href=" ./../../../actions/workflows/5_prototype_analysis.yml" >![5. Прототип анализ]( ./../../actions/workflows/5_prototype_analysis.yml/badge.svg)</a> 

<a href=" ./../../../actions/workflows/6_report.yml" >![6. Пояснительная записка]( ./../../actions/workflows/6_report.yml/badge.svg)</a>

<a href=" ./../../../actions/workflows/7_app_is_ready.yml" >![7. App is ready]( ./../../actions/workflows/7_app_is_ready.yml/badge.svg)</a>

# Система управления театральными декорациями

## Запуск

Из корня проекта:

```bash
docker compose build --no-cache && docker compose up
```

После запуска:

- приложение: http://localhost:5173
- Swagger backend: http://localhost:8000/docs
- MongoDB: localhost:27017
- база данных: `theatre_db`

Полный сброс БД и повторная инициализация:

```bash
docker compose down -v
docker compose build --no-cache && docker compose up
```

## Отладочные пользователи

Для проверки используются пользователи-заглушки.

| Роль          | Логин     | Пароль    |
| Администратор | `admin`   | `admin`   |
| Заведующий    | `manager` | `manager` |
| Пользователь  | `user`    | `user`    |

Пользователь может только просматривать декорации, заведующий - добавлять новые декорации и редактировать созданные им, администратор - добавлять новые декорации и редактировать любые существующие.

## Управление театральными декорациями

Для пользователя с ролью `admin` доступны все действия с любыми декорациями:

- просмотр списка декораций;
- добавление декорации;
- редактирование любой декорации;
- удаление любой декорации;
- обновление статуса любой декорации;
- просмотр карточки декорации.

Для пользователя с ролью `manager` доступны:

- просмотр списка декораций;
- добавление декорации;
- редактирование только тех декораций, которые созданы этим заведующим;
- удаление только тех декораций, которые созданы этим заведующим;
- обновление статуса только тех декораций, которые созданы этим заведующим;
- просмотр карточки декорации.

Пользователь с ролью `user` может только просматривать декорации без действий добавления, редактирования, удаления и смены статуса.