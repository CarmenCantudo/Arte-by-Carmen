// copyright year
$("#copyright").text(new Date().getFullYear());


// Carousel thumbnails
document.addEventListener('DOMContentLoaded', function() {
    var carousels = document.querySelectorAll('.carousel-with-thumbnails');
    carousels.forEach(function(carousel) {
      var carouselId = carousel.getAttribute('id');
      var indicators = carousel.querySelector('.carousel-indicators');
      var carouselItems = carousel.querySelectorAll('.carousel-item');
      carouselItems.forEach(function(item, index) {
        var img = item.querySelector('img');
        var imgSrc = img.getAttribute('src');
        var activeClass = (index === 0) ? 'active' : ''; 
        var indicator = document.createElement('button');
        indicator.setAttribute('type', 'button');
        indicator.setAttribute('data-bs-target', `#${carouselId}`);
        indicator.setAttribute('data-bs-slide-to', index);
        indicator.className = activeClass;
        indicator.setAttribute('aria-label', 'Slide ' + (index + 1));
        indicator.style.width = '100px';
        var indicatorImg = document.createElement('img');
        indicatorImg.setAttribute('src', imgSrc);
        indicatorImg.className = 'd-block w-100 img-fluid';
        indicator.appendChild(indicatorImg);
        indicators.appendChild(indicator);
      });
      carousel.addEventListener('slide.bs.carousel', function (e) {
        let index = e.to;
        document.querySelector(`#${carouselId} .carousel-indicators .active`).classList.remove('active');
        document.querySelector(`#${carouselId} .carousel-indicators [data-bs-slide-to="${index}"]`).classList.add('active');
      });
    });
});