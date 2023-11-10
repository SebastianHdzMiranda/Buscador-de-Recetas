document.addEventListener('DOMContentLoaded', iniciarApp);

function iniciarApp() {
    /* Selectores */
    const selectCategorias = document.querySelector('#categorias');
    const resultado = document.querySelector('#resultado');
    // instancia de clase de bootstrap
    const modal = new bootstrap.Modal('#modal', {});

    /* Eventos */
    selectCategorias.addEventListener('change', selecccionarCategoria);

    /* Obtener las Categorias 
    ----------------------------------*/
    obtenerCategorias();
    function obtenerCategorias() {

        conectarAPI('https://www.themealdb.com/api/json/v1/1/categories.php')
            .then( data => mostrarCategorias(data.categories));
    }
    function mostrarCategorias(categorias) {

        categorias.forEach( categoria => {
            const {strCategory} = categoria;
            const option = document.createElement('option');
            option.value = strCategory;
            option.textContent = strCategory;
            selectCategorias.appendChild(option);
        });
    }

    /* Seleccionar Categorias
    ----------------------------------- */
    function selecccionarCategoria(e) {
        const categoria = e.target.value;
        
        conectarAPI(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoria}`)
            .then( data => mostrarRecetas(data.meals));
    }

    // El parametro debe ser un array, eso indica esa sintaxis
    function mostrarRecetas(recetas = []) {
        limpiarHTML(resultado);

        const heading = document.createElement('h2');
        heading.className = 'text-center text-black my-5';
        heading.textContent = recetas.length ? 'Resultados': 'No Hay Resultados';

        resultado.appendChild(heading);
        
        recetas.forEach( receta => {
            const {idMeal, strMeal, strMealThumb} = receta;

            // Crear Scriptings
            const recetaContenedor = document.createElement('div');
            recetaContenedor.className = 'col-md-4';

            const recetaCard = document.createElement('div');
            recetaCard.className = 'card mb-4';

            const recetaImg = document.createElement('img');
            recetaImg.className = 'card-img-top';
            recetaImg.alt = `Imagen de la receta ${strMeal}`;
            recetaImg.src = strMealThumb;

            const recetaCardBody = document.createElement('div');
            recetaCardBody.className = 'card-body';

            const recetaHeading = document.createElement('h3');
            recetaHeading.className = 'card-title mb-3';
            recetaHeading.textContent = strMeal;

            const recetaBtn = document.createElement('button');
            recetaBtn.className = 'btn btn-danger w-100';
            recetaBtn.textContent = 'Ver Receta';
            recetaBtn.dataset.bsTarget = "#modal";
            recetaBtn.dataset.bsToggle = "modal";

            recetaBtn.onclick = ()=> {
                seleccionarReceta(idMeal);
            }
            

            // Inyectar HTML
            recetaCardBody.appendChild(recetaHeading);
            recetaCardBody.appendChild(recetaBtn);

            recetaCard.appendChild(recetaImg);
            recetaCard.appendChild(recetaCardBody);

            recetaContenedor.appendChild(recetaCard);

            resultado.appendChild(recetaContenedor);


            
        });        
    }

    function seleccionarReceta(id) {
        conectarAPI(`https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`)
        .then( data => mostrarRecetaModal(data.meals[0]));
    }

    function mostrarRecetaModal(receta) {
        const {idMeal, strInstructions, strMeal, strMealThumb} = receta;

        
        const modalTitle = document.querySelector('.modal .modal-title');
        const modalBody = document.querySelector('.modal .modal-body');

        modalTitle.textContent = strMeal;
        modalBody.innerHTML = `
            <img class="img-fluid" src="${strMealThumb}" alt="${strMeal}">
            <h3 class="my-3">Instrucciones</h3>
            <p>${strInstructions}</p>
            <h3 class="my-3">Ingredientes y Cantidades</h3>
        `;

        const listadoIngredientes = document.createElement('ul');
        listadoIngredientes.className = 'list-group';

        // mostrar cantidades e ingredientes
        for (let i = 1; i <= 20; i++) {
            if (receta[`strIngredient${i}`]) {

                const ingrediente = receta[`strIngredient${i}`];
                const cantidad = receta[`strMeasure${i}`];

                listadoIngredientes.innerHTML += `<li class="list-group-item">${ingrediente} - ${cantidad}</li>`;
            }
        }

        
        
        modalBody.appendChild(listadoIngredientes);
        
        // Botones Codigo
        const modalfooter = document.querySelector('.modal-footer');

        limpiarHTML(modalfooter);
        
        const favoritoBtn = document.createElement('button');
        favoritoBtn.className = 'btn btn-danger col guardar';
        favoritoBtn.textContent = 'Guardar Favorito';
        favoritoBtn.onclick = ()=> agregarFavorito(receta.idMeal);
        
        const cerrarBtn = document.createElement('button');
        cerrarBtn.className = 'btn btn-secondary col';
        cerrarBtn.textContent = 'Cerrar';
        // Oculta el modal
        cerrarBtn.onclick = ()=> modal.hide();

        modalfooter.appendChild(favoritoBtn);
        modalfooter.appendChild(cerrarBtn);

        // muestra el modal
        modal.show();

        // agregarFavorito(receta);
    }

    function agregarFavorito(receta) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];

        favoritos.push(receta);

        localStorage.setItem('favoritos', JSON.stringify(favoritos));

    }

    function limpiarHTML(selector) {
        while (selector.firstChild) {
            selector.removeChild(selector.firstChild);
        }
    }
    
    function conectarAPI(url) {
        return fetch(url).then( respuesta => respuesta.json());
    } 
}