let mix = require('laravel-mix');


mix
	.setPublicPath('public/')
	.setResourceRoot('../')
	.js('src/js/app.js', 'public/js')
	.sass('src/scss/app.scss', 'public/css');
  
