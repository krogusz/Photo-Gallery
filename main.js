const ENDPOINT = "http://www.splashbase.co/api/v1/images/search?query=tree";

//independent functions
const figureClass = idx => (idx === 4 || idx === 8)?"photo2":(idx === 7 | idx === 9)?"photo3": "photo1";

//defining elements oryginally rendered
const container     = document.getElementById("gallery");
const modal         = document.getElementById("modal");
const modalImg      = document.getElementById("modalImg");
const span          = document.getElementById("close");

span.onclick = function() {
    modal.style.display = "none";
}

class Gallery{
    constructor(container){
        this._container = container;
        this._step = 0;
        this._results = [];
        this._filter = "show all";
        this._maxResult=0;
    }

    async _runSearch(){
        const apiResponse = await this._fetchData();
        this._results = apiResponse.images;
        this._maxResult = Math.floor(this._results.length/10);
        await this._loadPhotos();
    }

    async _fetchData(){//return response from API
        const response = await (await fetch(ENDPOINT)).json();
        return response;
    }

    async _loadPhotos(){//parse and render the appropriate part of the API response
        const newImages = this._parseData(this._results, this._step);
        await this._renderPhotos(newImages);
        this._step ++;
    }

    _parseData(data, step){//take the next 10 elements from API and return array of objects
        //with url and site name for each elemnt
        const results = data.slice(step*10, (step+1)*10).map(image => {
            const {url, site} = image;
            return{url, site};
        });
        return results;
    }

    async _renderFirstElements(){
        await this._runSearch();
        await this._renderButton();
        this._activateFilter();
        document.getElementById("showMore").style.display = "block";
        document.getElementById("loader").style.display = "none";
    }

    async _renderPhotos(data){//render gallery with 10 chosen images
        //render each new set of images in separate photoSetDiv
        const photoSetDiv = document.createElement("div");
        photoSetDiv.classList.add("photoSet");
        photoSetDiv.style.display = "none";//wait for all images before new div is displayed
        photoSetDiv.id = `photoSet${this._step}`;//each div has separate id depending on which image set is rendered

        //wait until all pictures are on the page, each image is attached to photoSetDiv
        var result = await this._loadAllImages(data, photoSetDiv);
        this._container.appendChild(photoSetDiv);

        photoSetDiv.style.display = "grid";

        //disable loading gif on the button after new images are loaded
        if(this._step !== 0 && this._step !== this._maxResult){document.getElementById("showMore").innerHTML = "SHOW MORE"};
        if(this._step === this._maxResult){document.getElementById("showMore").style.display = "none"};
    }

    async _loadAllImages(array, container){//return promise.all with all of chosen images

        var index = 0;
        function checkImage(item){return new Promise ((resolve, reject) => {

            //create <figure> as a container for <img> and <div>
            const figure = document.createElement("figure");
            figure.classList.add(item.site);
            const title = document.createElement("div");//element visible when user is hovering over an image
            title.classList.add("titleImage");
            title.innerHTML = `#${item.site}`;
            figure.appendChild(title);
            const img = new Image();
            img.classList.add("image");

            //assign CSS class, append <img> to <figure> and append <figure>
            //to div created in this._renderPhotos when image is loaded
            img.onload = () => {
                const classCSS = figureClass(index);
                figure.classList.add(classCSS);
                figure.appendChild(img);
                container.appendChild(figure);
                index ++;
                resolve(item)}

            //assign url after img.onload finishes
            img.src = item.url;
            //zoom view
            img.onclick = () => {
                modal.style.display = "block";
                modalImg.src = item.url;
            };
        })};

        return Promise.all(array.map(checkImage));
    }

    _renderButton(){ //render button and define click event
        const buttonDiv = document.getElementById("buttonDiv");
        const button = document.createElement("button");
        button.innerHTML = "SHOW MORE";
        button.id = "showMore";
        button.style.display = "none"; //wait for all images before showing the button

        //show loading gif
        button.addEventListener("click", evt => {
            this._loadPhotos(evt);
            button.innerHTML = `<img id=loaderSmall src="./loader.gif"/>`;
        });
        buttonDiv.appendChild(button);
    }

    _activateFilter(){
        const filters = document.getElementsByClassName("filter");
        const filtersArray = Array.from(filters);

        //add event listener with coloring and filtering actions to each filter button
        filtersArray.forEach(filter => {
            filter.addEventListener("click", env => {
                //uncheck the previous filter
                this._removePreviousFilter();
                //change filter button's colors
                this._changeFiltersColors(env.target);
                //change _state of the constructor
                this._filter = env.target.innerHTML;
                //show the right pictures
                if(this._filter !== "show all"){this._filterImages()};
            })
        })
    }

    _changeFiltersColors(element){//control the filter's colors by adding/removing coloredFiltered CSS class
        const filterToRemove = document.getElementsByClassName("coloredFilter")[0];
        filterToRemove.classList.remove("coloredFilter");
        element.classList.add("coloredFilter");
    }

    _filterImages(){
        //create an array of elements, which should be filtered
        const chosenElements = document.getElementsByClassName(this._filter);
        const chosenElementsArray = Array.from(chosenElements);
        const allElements = document.getElementsByTagName("figure");
        const allElementsArray = Array.from(allElements);
        const filteredElements = allElementsArray.filter(x => chosenElementsArray.indexOf(x) < 0);
        //for each filtered <figure> toogle class for <div> and disable displaying for <img>
        filteredElements.forEach(el => {
            el.classList.add("filtered");
            Array.from(el.children)[0].classList.remove("titleImage");
            Array.from(el.children)[0].classList.add("noTitleImage");
            Array.from(el.children)[1].style.display = "none";
        });
        //disable "SHOW MORE" button, because filtering is done only on already loaded images
        document.getElementById("showMore").style.display = "none";

    }

    _removePreviousFilter(){
        //find elements with class = filtered
        const elements = document.getElementsByClassName("filtered");
        const elementsArray = Array.from(elements);
        //display each children of each filtered element
        elementsArray.forEach(el => {
        //remove color from previous filter
        el.classList.remove("filtered");
        Array.from(el.children)[0].classList.add("titleImage");
        Array.from(el.children)[0].classList.remove("noTitleImage");
        Array.from(el.children)[1].style.display = "block";
        });
        if(this._step < this._maxResult){document.getElementById("showMore").style.display = "block"};
    }
}


//create gallery object
const gallery = new Gallery(container);
gallery._renderFirstElements();
