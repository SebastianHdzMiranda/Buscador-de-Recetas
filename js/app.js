document.addEventListener('DOMContentLoaded', iniciarApp);

function iniciarApp() {
    /* Selectores */
    const selectCategorias = document.querySelector('#categorias');
    const resultado = document.querySelector('#resultado');
    // instancia de clase de bootstrap
    const modal = new bootstrap.Modal('#modal', {});
    const favoritosDiv = document.querySelector('.favoritos');

    if (selectCategorias) {
        /* Eventos */
        selectCategorias.addEventListener('change', selecccionarCategoria);
        
        obtenerCategorias();
    }

    if (favoritosDiv) {
        obtenerFavoritos();
    }

    /* Obtener las Categorias 
    ----------------------------------*/
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
            recetaImg.alt = `Imagen de la receta ${strMeal || receta.title}`;
            recetaImg.src = strMealThumb || receta.img;

            const recetaCardBody = document.createElement('div');
            recetaCardBody.className = 'card-body';

            const recetaHeading = document.createElement('h3');
            recetaHeading.className = 'card-title mb-3';
            recetaHeading.textContent = strMeal || receta.title;

            const recetaBtn = document.createElement('button');
            recetaBtn.className = 'btn btn-danger w-100';
            recetaBtn.textContent = 'Ver Receta';
            recetaBtn.dataset.bsTarget = "#modal";
            recetaBtn.dataset.bsToggle = "modal";

            recetaBtn.onclick = ()=> {
                seleccionarReceta(idMeal || receta.id);
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
        const {idMeal, strInstructions, strMeal, strMealThumb, strYoutube} = receta;

        // variable que extrae el id del video
        const videoId = strYoutube.match(/v=([^&]+)/)[1];
        
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

        const video = document.createElement('div');
        video.className = 'my-3';
        video.innerHTML = `
            <iframe 
                width="100%" 
                height="315" 
                src=https://www.youtube.com/embed/${videoId} 
                title="YouTube video player" 
                frameborder="0" 
                allow="accelerometer; 
                autoplay; 
                clipboard-write; 
                encrypted-media; 
                gyroscope; 
                picture-in-picture; 
                web-share" 
                allowfullscreen>
            </iframe>
        `
        
        modalBody.appendChild(listadoIngredientes);
        modalBody.appendChild(video);
        
        // Botones Codigo
        const modalfooter = document.querySelector('.modal-footer');

        limpiarHTML(modalfooter);
        
        const favoritoBtn = document.createElement('button');
        favoritoBtn.className = 'btn btn-danger col guardar';
        
        favoritoBtn.textContent = existeStorage(idMeal) ? 'Eliminar Favorito' : 'Guardar Favorito';

        favoritoBtn.onclick = ()=>{ 

            // codigo que me permite no añadir duplicados al storage.
            if (existeStorage(idMeal)) {
                eliminarFavorito(idMeal);
                favoritoBtn.textContent = 'Guardar Favorito';
                mostrarToast('Eliminado de Favoritos');
                // esta expresion se utiliza para verificar si la cadena "favoritos.html" está presente en la URL actual, si se encuentra devuelve el numero donde se posiciona, si es -1 es que no existe.
                if (window.location.href.indexOf('favoritos.html') !== -1) {
                    location.reload();
                }
                return;

            }
            agregarFavorito({
                id: idMeal,
                img: strMealThumb,
                title: strMeal,
            });
            favoritoBtn.textContent = 'Eliminar Favorito';
            mostrarToast('Agregado a Favoritos');

        }
        
        // const cerrarBtn = document.createElement('button');
        // cerrarBtn.className = 'btn btn-secondary col';
        // cerrarBtn.textContent = 'Cerrar';
        // // Oculta el modal
        // cerrarBtn.onclick = ()=> modal.hide();

        modalfooter.appendChild(favoritoBtn);
        // modalfooter.appendChild(cerrarBtn);

        // muestra el modal
        modal.show();

    }

    function agregarFavorito(receta) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
        
        /* Por que se usa una copia del arreglo?:
            - Cuando se almacena un arreglo en localStorage sin crear una copia, se produce una situación en la que cada vez que se agrega un nuevo elemento al arreglo y se guarda nuevamente en localStorage, se crea una nueva instancia del arreglo anidado. 

                [receta[receta[receta]]]
            
            - Sin embargo, al crear una copia del arreglo utilizando el operador de propagación ... (spread operator), como en JSON.stringify([...favoritos, receta]), se asegura que solo se guarde la última versión del arreglo sin anidamiento adicional. Al utilizar una copia del arreglo, se garantiza que siempre se almacene la instancia más reciente y actualizada en localStorage, sin crear múltiples niveles de anidamiento.

                [{receta}, {receta}]
        */
        localStorage.setItem('favoritos', JSON.stringify([...favoritos, receta]));
    }

    function eliminarFavorito(id) {
        const  favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
        const nuevosFavoritos = favoritos.filter( favorito => favorito.id !== id);
        
        localStorage.setItem('favoritos', JSON.stringify(nuevosFavoritos));
    }

    function existeStorage(id) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
        // some revisa si un valor existe y te retorna un boolean
        return favoritos.some( favorito => favorito.id === id);
    }

    function mostrarToast(mensaje) {
        const toastDiv = document.querySelector('#toast');
        const toastBody = document.querySelector('.toast-body');

        // instancia de toast de bootstrap 
        const toast = new bootstrap.Toast(toastDiv);

        toastBody.textContent = mensaje;
        toast.show();
    }

    function obtenerFavoritos() {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];

        // console.log(favoritos);
        if (favoritos.length) {
            
            mostrarRecetas(favoritos);
            return;
        } 
        
        const noFavoritos = document.createElement('p');
        noFavoritos.textContent = 'No hay favoritos';
        noFavoritos.className = 'fs-4 text-center font-bold mt-5';

        resultado.appendChild(noFavoritos);
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