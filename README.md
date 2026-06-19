# alergicos-a-leer
# 1.- Integrantes:
## Patricio Elías Ubilla Mella
Creó la base de datos completa, respetando normalizaciones y las 3 formas normales.
## Daniel Alejandro Lobos Miranda
Front-end aplicando bootstrap, lideró decisiones de diseño para mantener coherencia de estética.
## Lucas Vicente Correa Miranda
Front-end aplicando bootstrap, colaboró con Daniel para acelerar el proceso del desarrollo.
## Nicolás Jesús Ortiz Ortiz
Desarrollo del back-end, lideró el desarrollo junto con colaboración de Daniel.

# 2.- Descripción del proyecto
Biblioteca Alérgicos a leer, educación. Resuelve la tediosa tarea de la búsqueda de libros y autores por parte de un cliente que busque pedir préstamos de libros.

# 3.- Requisitos previos
Debe tener instalado Node.js `v24.13.1`, XAMPP `v3.3.0`, Git Bash o una distro de linux instalada con WSL.

# 4.- Instalación paso a paso
Clonar el proyecto desde el repositorio `git clone https://github.com/Remonikku/alergicos-a-leer`, al tenerlo copiado, en una terminal de Git o Linux en VS Code, ejecutar `npm install` para instalar las dependencias necesarias. Para probar la página, ejecutar `node run start` y debería funcionar todo correctamente.

# 5.- Configuración de la base de datos
La base de datos, ubicada en la carpeta principal del proyecto, llamada `database.sql`, internamente se llama `Libreria`. Las credenciales para acceder a la base de datos son `user: localhost` y `password: ""` (no tiene contraseña)

# 6.- Credenciales de prueba
Para entrar como administrador, ingresar las siguientes credenciales `Usuario: admin`, `Contraseña: admin123`

# 7.- Uso del sistema
La vista pública es lo primero que uno ve al iniciar la página, el usuario verá una lista con los libros que existen y se pueden o no pedir dependiendo de su stock. Para entrar a la vista de administrador, hay un botón en la esquina superior derecha que dice `Administración`, una vez ahí, es necesario ingresar como administrador. Los controles de administración son los siguientes: 
```
Pestaña Libros: El administrador puede gestionar los libros
disponibles, además de ingresar libros nuevos a la base de 
datos.

Pestaña Autores: Puede gestionar autores para asignarlos 
posteriormente a un libro creado.

Pestaña Géneros: Gestionar géneros de los libros para 
asignarlos posteriormente.

Pestaña Préstamos: El administrador puede revisar los préstamos
realizados, gestionarlos y marcarlos al estado que estime
conveniente,

Pestaña Usuarios: El administrador puede registrar otros
administradores, cambiando sus credenciales para que cada uno
pueda revisar lo que necesite cuando esté trabajando.
```
# 8.- Estructura del proyecto
```
├── config
│   └── db.js -configuracion base de datos
├── controllers
│   ├── authController.js -funciones y metodos para realizar el login
│   ├── autorController.js -funciones y metodos para gestionar los autores
│   ├── generoController.js -funciones y metodos para gestionar los generos
│   ├── libroController.js -funciones y metodos para gestionar los libros
│   ├── prestamoController.js -funciones y metodos para gestionar los prestamos
│   └── usuarioController.js -funciones y metodos para gestionar los usuarios
├── database.sql -archivo de la base de datos
├── model -carpeta de las clases
│   ├── Autor.js
│   ├── Genero.js
│   ├── Libro.js
│   ├── Prestamo.js
│   └── Usuario.js
├── package.json
├── package-lock.json
├── public
│   ├── index.html -vista principal
│   └── js
│       ├── admin.js -funciones para los controles del administrador
│       └── public.js -funciones para los controles del usuario
├── README.md
├── server.js
└── views
    ├── admin.html -vista administrador
    └── login.html -vista inicio de sesión
```

