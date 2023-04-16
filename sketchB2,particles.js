const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const math = require('canvas-sketch-util/math');
const eases = require('eases');
const colormap = require('colormap');
const interpolate = require('color-interpolate');

const settings = {
	dimensions: [ 2040,2040 ],
	animate: true,
};

const particles = [];
const cursor = { x: 9999, y: 9999 };

const colors = colormap({
	colormap: 'viridis',
	nshades: 20,
});

let elCanvas;
let imgA, imgB;

const sketch = ({ width, height, canvas }) => {
	let x, y, particle, radius;
	
	const imgACanvas = document.createElement('canvas');
	const imgAContext = imgACanvas.getContext('2d');

	const imgBCanvas = document.createElement('canvas');
	const imgBContext = imgBCanvas.getContext('2d');

	imgACanvas.width = imgA.width;
	imgACanvas.height = imgA.height;

	imgBCanvas.width = imgB.width;
	imgBCanvas.height = imgB.height;

	imgAContext.drawImage(imgA, 0, 0);

	const imgAData = imgAContext.getImageData(0, 0, imgA.width, imgA.height).data;
	const imgBData = imgBContext.getImageData(0, 0, imgB.width, imgB.height).data;

	const numCircles = 90;
	const gapCircle = 9;
	const gapDot = 16;
	let dotRadius = 9;
	let cirRadius = 20;
	const fitRadius = dotRadius;

	elCanvas = canvas;
	canvas.addEventListener('mousedown', onMouseDown);

	for (let i = 0; i < numCircles; i++) {
		const circumference = Math.PI * 2 * cirRadius;
		const numFit = i ? Math.floor(circumference / (fitRadius * 2 + gapDot)) : 1;
		const fitSlice = Math.PI * 2 / numFit;
		let ix, iy, idx, r, g, b, colA, colB, colMap;

		for (let j = 0; j < numFit; j++) {
			const theta = fitSlice * j;

			x = Math.cos(theta) * cirRadius;
			y = Math.sin(theta) * cirRadius;

			x += width  * 0.5;
			y += height * 0.5;

			ix = Math.floor((x / width)  * imgA.width);
			iy = Math.floor((y / height) * imgA.height);
			idx = (iy * imgA.width + ix) * 4;

			r = imgAData[idx + 0];
			g = imgAData[idx + 1];
			b = imgAData[idx + 2];
			colA = `rgb(${r}, ${g}, ${b})`;

			radius = math.mapRange(r, 0, 270, 2, 12);

			r = imgBData[idx + 0];
			g = imgBData[idx + 1];
			b = imgBData[idx + 2];
			colB = `rgb(${r}, ${g}, ${b})`;

			colMap = interpolate([colA, colB]);

			particle = new Particle({ x, y, radius, colMap });
			particles.push(particle);
		}

		cirRadius += fitRadius * 2 + gapCircle;
		dotRadius = (1 - eases.quadOut(i / numCircles)) * fitRadius;
	}

	return ({ context, width, height }) => {
		context.fillStyle = 'black';
		context.fillRect(0, 0, width, height);

		particles.sort((a, b) => a.scale - b.scale);

		particles.forEach(particle => {
			particle.update();
			particle.draw(context);
		});
	};
};

const onMouseDown = (e) => {
	window.addEventListener('mousemove', onMouseMove);
	window.addEventListener('mouseup', onMouseUp);

	onMouseMove(e);
};

const onMouseMove = (e) => {
	const x = (e.offsetX / elCanvas.offsetWidth)  * elCanvas.width;
	const y = (e.offsetY / elCanvas.offsetHeight) * elCanvas.height;

	cursor.x = x;
	cursor.y = y;

	console.log(cursor);
};

const onMouseUp = () => {
	window.removeEventListener('mousemove', onMouseMove);
	window.removeEventListener('mouseup', onMouseUp);

	cursor.x = 9999;
	cursor.y = 9999;
};

const loadImage = async (url) => {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject();
		img.src = url;
	});
};

const start = async () => {
	imgA = await loadImage("data:image/jpeg;base64,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");
	imgB = await loadImage("data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBw0PDg8PDw8NDw8XDxAPDg4PDRUPEBAQFRYWFhURFRUYHSggGBolHRUVITEhJykrLi4uFx8zODMtNygtLisBCgoKDg0OGhAQGC0lHyUtLSsrLSsrLS0vLS0tLS0tLS0tLS0tLS0tLSstMCsrLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAOAA4AMBIgACEQEDEQH/xAAcAAACAgMBAQAAAAAAAAAAAAAAAQIGAwQFBwj/xABAEAABBAECAwUFBgMGBgMAAAABAAIDEQQSIQUxQQYTUWFxByIygZEUQlJiobEzwdEVI4Ky4fE0Q3KSovAWJCX/xAAbAQACAwEBAQAAAAAAAAAAAAAAAQIDBAUGB//EADARAAIBAgQEBQMDBQAAAAAAAAABAgMRBBIhMQVBUYETYXHB8CKhsTKR0QYjQuHx/9oADAMBAAIRAxEAPwDzkBSpACdLsnLEmnSE7AKkUt1vDJi0ODQQRYAIuvRarmkGiCD1B2KS1G1YjSKTpOkxEaTpOkUgBUilKk6TAhSKU6SpAEaRSlSKSAhSKUqRSAI0mnSVIsBFClSVIsAkqUqTSAhSVKSEDIUilKkqSHcmmnSdKZEjSdKSKQItOC8OiYR+EfUbFPJwo5R7436OHxBc3gWSN4nGrNs9eoXcYKO9+oWWSyyNMXmRW8/hEsQ1Aa4/xt6f9Q6Ln0vRMZvUG/NvP5jqubxTs0yQF8OmN/UAf3bj5jmw/opRrraRCVLminUilOWJzHFrgWuHMFRpaCkVITpFJgKkUnSKQAqRSdIpACpFJ0ikAJJSpJICNJUp0ikAQpKlOkIAhSVKVIpIZBClSVJAZE6STpTEJNOkUgQNJBBGxBsHwKtfCc8TCthIB7w8fMKq0skMjmODmmiDYKhOGZEoTcWX5ja3c0t/M3/RbkT+vxD8Tfi+fiuTwTizJhp1d3JW7HCwfMFdQxnmNF+LHUfoVhnFrRmtNNXRizuE42RTntFjk8bfI1yXA4t2QlZb8bVK3mYj/FaPFtbPHpv5KzskIO9g+I2PzHVaPaXisceLNE2VzZnNa1vdu0vbrLqcDvWzXcvDokqzpK99CcaHjSUIrV6IoDDVGrF3uLB9VuS8cxmlofixfD71CgSNvdI3G3Tx8Vr4uSyCPYP7tgLtDXEEtLrdRPXmvQ/aVwLvMEvi+zYuHjwnJ1aNeTkTEECEnbSNxuSbJ5bKEcd41/otbnf2svybMbwpYLInUzOSvbLZLvfr5a76FR4RHw/NPdMLoJ9y1odqbIB4X18vosXE+AzwWa1sH32jl6josWD7L+NSQwZMLIhrY2Vg+0d1LHe7SbAp3I7HZezYPZyd2JAMoxnLEY75zB7hfW/r/urIYmaZz50YnhNIpXLth2UkgeXsZQNnS0bEgW4Dzqz5gHw3pwW+E1NXRknFxdmKkUpUkpkSNIpSRSQ7kKRSlSKQFyNJUpUlSAFSSnSVJDIJUp0kgCVJ0tnugo9yi6CzMFJ0sphKj3ZTuRsyKy42O+R7WMaXOJoAfuo6Veuy/CO5jD3D+9eAT+VvRv8AVQqTyK5KEczsbPAuAw45D+6dLJVazdb86HILv6IyP+Hd/wBgU4IpQPjDR9VnJYPjnJPgH1+y50pOTuzaklojmz4bCNmSN/w2PovNO1+A+PLdMXEtexrQ0tI06Nq39b+ZXrTpI/uukd6FxVY7VcMbkRuaNn/Ewk6iHDy6A8lXOOaLRpwlZUa0Zvkee8Ll0zxuILg14c4D4tIIJr6LL7UO0suVOzHa5wxWMjkYKpsr3tDu88wLofNc4ufG8g20iw4Hp0ISgw5M4Y2IHMJj1NY8khwjIBLSDzotNeqz0IWujp8UqeI4S9V89j3j2edrYeJYjXsaI5Iw2OeHox1baemk1YVzjNrzfsHjfZxO3QGjWwNd+MNjaC701aqXY7d9qHcM4dJkR6HTlzIYA/dpkd1rqA0OdXkr9jjc9Cue13t1FC2Th2MC7MBidJNQDcaqkaWnrJy9LvyXFwuL8H4vivdktOHxJkeqSSCOxMR9/uxs+/D4ulry7LzZZ5XzzSPlle7VJK82555b/oK6Iikex7ZIyWvaQR0vyPkVGM3F3TsScFJWZa8/hz4Qx+pksL7MORES6KUA0QCd2uB2LSAR1C06XoHC8syYzG/Ypc3Fma1748duqWMu370M5OIN3yPgVxe1vZHI4eWyU5+M+u7m0lpaTuI5GndjvX911KGIU/plv+TDVo5NVsVmkqWSkqWmxQQpCnSjSLARSpSpFJARpKlJCQyFIpTpKkBc3E6QpKBaCVJ0nSAubvBMYSTsBGw98/LkPrSuol86VQ4A4Cb1YQP0VkBWatrLUup7HRZIzqXvPgFssc77sbGDxcVzBltY2/dYOrnGguVm9pGjaNpkP437M+TevzVSpylsTckty0mQfeeXeOnZoXH4n2ixYwWtIefwx+99TyVUzOITzfxHuI6N5NH+EbLUpXxw6/yZVKq+Ri43IzKfr7sRnxBsn16LTw3PgmilqwxwvRzp50ucR4Udx5AroaAkIxzVkqNN7KwliKqjlbuvmx6LwbMB077dAqD7ZuKvlzocbV/dxQNfoB/5shJJPnpDfqfFdvs3l0Q0nl+wVJx+D5PF8jJngovfOdDXXuHHa3fdDW6d1grRyuxpg01crg8+f0Vs9nnZOXimZEzQ84jHasuYFzGBg5xB4HxnbbnVnbmu232ZjAjmzOMTEYUTYiWYY1SzyPod00urSA5wGo1fkN16P7MeK/aIw+MMxMK3xYHDY4gSIm1/9iaSrLyQ7ka331E2qLFtztjgcHD4ofsjCyOK26NbnksJLiCXEk7kqfFO0HDDL/Z+VJGDLCxwbMNMUjZLAZr5B23lzFbqwTRhzS09QvIe0nA2ScS1ZMT58cQESM1lgprSxrS8bt3cyq62iTsrhGDlJRW70RVu0vBBiyv7vvO616CyVumaB+5EUg5GwCWvFteBYOxXGpWXivEjgAhjMqfh8g0z4OTMZA0fdfBO4FzHNNEdCqxFNHINUZcWWa1ABw8nAbX6Lp4PFKtHfUx43CTw1TLNWfT5yJUlSdIpbDGRpFKVJIAhSVLJSVJWGQSUqSpIDcpOk06UC0SaaaYiUMhY4ObsQbC6n9tv01obq8b2+i5Kai4J7jUmtjJPO+Q29xd4eA9AsadKSklYRGk6UqRSAFSdJ0nSYgjl0EuuhpdfoWlbnsizBh42TlPBdqlZjwxtb7z5dIcRfh8P0K0XssEeII+q6nZDJx4zhRyFoZBDJPILFvyDq+rvdsfJc/HfSk1pfT8HS4bT8WdpJtLVpbtJN206vT7npfbPs9kcUix8RsrIsMzNk4hz72SNlObGzba3DntyHobPwzAgxoY4II2xxMY1jGjo1oobnc8uZWLhM5khikILS+Njy38Jc0Gv1XO492z4XgvbFk5DRO4tDceNjppiTsPcYCRfLdZG09UNJp2e6LEql2pgIc6vhNPIrYkbX/5FZeCdv+E5s5xocgjI1OaIZonwPc5vxNAeBZFHbnsV1eJ4jZpI2OsAtfuOe1EfqoTjmi0X0Kip1YzfJ/6PLs6B252A8CN6/kqlJwqFhmLWva92hzQHe5YvUKPiCNx1Hnt7xxLs5hztAdHoIFB0dMdXgfH5qjca7BZLXF0b2PivVd09rfNvWvJYoxrYeoqlP/vr5Hpo4rA4+i6GIeXpfk+sXrr5c9jzEsKVLqZuM6KRzXCjYFdPOvJaxYF6qFRTipLZ6ngauHlSnKnLdOz7c15PdeWpp0lS2jEFEwqeZFWVmtSaymEqBjKLoVjGilMtUaQBtpoTUC0E6TTQAITTTEKk6QmgApFKSEAKlJJNMVwW32M4UzIz6koxs1SFh5VYoHysg/IrVpRz+I/Y+H5T2Bwlmc3Fa4GqZoLnuHo3Vv4keCx42ClBX5P2Z0OH4l0HUcXZuNl63WvZX9GdXt37W5Ha8Xhbu7YLa/NHxurn3I+6PzHc9K5rziDiscUMjPs2PLNLr73KytUkjSfhdDRHduHMuNkny2V/7O+yxuTjwNfJ3eS7RPmP95wxMdwJjhaNmGRzdLjZJAI2A3Ntk/sDhcPc4WNj5M/wvllaZrI2LpHn4twPdbQ9FzKtSMFeTNmFwtXES8OjG7+y9Xsu54Hju94OBIIIIc11EOG4II5FfTHsyysiTheLPlzGQhs7u+kmEh7rVQLnVYqjsSSK59BUJc7hmc0RZ/DcZrdmxz4cf2eWG6Fg3uBzq625FZsHs5w9kQwn8byn4wmdI2LGhbE2y6x30mh2s7DwFi6CqhiaUtVL99DViOEYylJRdNvn9P1L7e5z+1HaLKk4hNLBO+JrZHMhe2QhpY22gtAPUb3+ZaXCfaFn8PnaZ5JsqCiJYnyF2oVsY3v5EeHXe/FehD2Z8JkYHRS5BBGz2zNlafPdp/SlU+2XsuyoYXy4coyI2t1Ox3s0yhoBLiwiw89aoH1PO5HOtbRmv2pz8HOLc7BlbJGabOzSWSRTHURradwHAOo8vdO6r1Kq9mstzMktB92VjmPo7Ej32u89218yrWuphH/bt5v+TJipOU7vey+2n4SI0lSlSFpMxCkqU0qSAgWqBjCy0lSABNCaYAmkmgBoTTQAJpITECaaE7CBSSTQA1s8N4R9ulbFM7RhxkyZL9WnTEAHvbfi5wiHkA5a62HZjmwCBuzXEySkcy4bMZ6AC/8AE3wWLiFRU6Lkzo8JwksXio0o930Wl37LzaO/2p7WyZVww6osUHS1o910lci4eHgPrvyqUz3i9LS7awbG5/CBf9FmapD1XkJzc5Zpas+q0MLToUlSpKyXy76vzK5xDBzpXiRjO7J2domDXVtWsa9Pjy8Vlh4BPHpdCHOsAvYJAyQH8OzqNeNqxMb635rcxm/lPyvf6K+GJmkkrW+eZzMTwehUcpylJyezutHza0SV+e9+Zo8E7UcQwX+6T0a4P99vkHi7+vyKunYj2i5WTnjEzRjBsod3EkdsAlFVFud7F11vqbVQ49jAxGRrHOeKDxf3OpcDzpUDijwCK1s5adyNJHULoUZKUbpWPI8QoVKNbJUk5dG97ct+nddOi9C9svZ6PE4liZ8DGxsmkDZ2tFDv2uBL6/M09OrSeq5tKvcT7W5GbiYGHMC8wTk9+6QvfKHEBgN7+6CRd77KxFdjB/pZxMV+pISipJLYZrkaQpKKQxJUpJIAEJpoAE0kJiBNCkgQlJJNMAUgopoAaaSECJV+1/ILEDZJ33/kSs/duMcjwDTa1O6N1XX1WGMLz3Gq31Rprkr/AL/6/J73+kMLalUxD/yeVeiWv73t2MoU2NvyUAtnGYDz8Nlwkj2M3ZXEdtj9VswH82/otZzjfQ+nJTjcORFeG39E0VSV0bsrxpIJp1URzBHmqZm8DDnPb3w7nmxlWWE/mPS6VnyJjpojccuv6rlTOVsako/pZkqYKjWS8WN7bd91pun0d1t0KHhQuGSxjtnCdjXfJwXoCqskP/6MbvExvHyG/wDlKta9XgHelm6/wfMeJ0vBxEqfRtdr6fazEoqSFtOeQQpJJARQmkgYkITQAKSEJgNCEIAE0IQIaEIQA0ITTAyszntilhFaZAwSXzAYdYr5rC1Y698+hWWl4zH1M9eTvzf5Z9b4LQVDCU4Ws8sW/XKr9ycYJK6Mnus0u2PMUd/9lq4UOpw3r5WtjLeeRafDcc/RZFsbqjvJI0neqA/xP0UT6LG91JItei1JTSnla0p319Qu32d4dFkTGORzgND3jS0HTVb7nrdcuoS472cazWYJnuIJOhzBZHgCOvyWqjhpzWZbHJxXFsPh6nhTbUt9nby1+edikcDc6aSJ7ty18xB/LpuvlqP1VpXB7NYujzrX/wCRA/Zn6rvL1eDilT06v82PmnEZynXvPe0b+byr/nYikpqK1GIihNJIBJJoQBBSQmgYJpIQIaEIQA0IQgAWSCF8jgxjS5xNBoFkqCv3Zvg/cRCQi5XAF56sB5M/96qurUUFcnCGZnHwOyErv40jYvytGt3zPIfqurj9i4Hf3ZfL3hBAeSAAfxaeqs2NG2UUfdcOTv6rejpj4g4Au96iDuWgUf3CwyxE3zNSpRXL3PLj2K4j9okjEWqt+9Dg2Ijbk41Z35eRXPyeHzQyGOVj2PBotc2r8weRHmNl7fA63u9VsS48b/jYx+1e80O2PTdcipgYv9Mv31PWUP6lqxl/cpprybTv11uu1jxvhuCC2+visHEqZtdnqvUcnspim9GuK7NNNts78jy9AqxxH2eyO1ubktOxLGmMgl3QE3t60s8sLUSslc6NHjWFlPNUnlXRp+yZ57JItZ7+q38rg+WxxD4J2kcyYyAPmB+qk/geXTCYZWNcQ0PdGWgbWXFxHKt/NZ4wd7WO1OvTUc7krdbr4+1zJ2ajla85BIDSx7A2zqcTW9eGy6UkpJsrJmtY3u2xjS0M0ADwby/dac3wOP5TXryH6r0NCkqcVFfGfNcdipYmrKrLt6cvtv5nA4fEGRjz3HpWy2Vnhw5XbMjefABpW23s/nEWIH/Vo/murDLTio3WhyqspVakp23fz7aHNQs2RhzR33kUjKNEuYQL9eSwqwpEoqSSAIpKSEhmNNCEANCEIAaEk0ACaSnEzU4CwLIGpxoDzJ8EwOv2Z4cZptRHuMpx83dB/P5L0LEEgOzXEddtlXuF5nD8aMM+0MPVxAc8uceZpoW3/wDMsGP4WyyH8sen/M5c+rnqS0i7cjXDLBatFsxoGHfQWny2WvxghkkG2+maj4fw9lUcj2hu5Q4zR4Okkv8AQD+ax8G7QZOZkVO5tBhMbWt0gEkA+fgq3QqJZmiSqxbsi78NyKcSTzJseBXaZM09QuG8thxpZXM1hsbpNLR8VC6CojO1mZI8uYIYhWzRGS35kus/osVWvCFlLc6eD4dXxUXOnay0d3bXpz/jzPWXyADmufk5jeQNlUjg/bISOMWU9kTttMgsRuO93fw9OZPNd5xcCTfXb5qdKpGavFlOKw1bDTyVY2fLo/R7P252eh2TliJlnc9dwAF5/wAQ4/DmZc8TTKRD7rpHEd2990Q1vQAirJ3/AH3e0HEaZpv1KpOPpjcQ083anu6uPOyr4xuZXY6ed8TQPzH9ls4sbGtt4Hlf7riT8QOouAF1paDyoeK7GDxCLKLY/wCBNsAwk92//pcCCPQ/qpzpzUb2EpxzWvqWbs7jxO94hvPayNv1XemZE0c2fNxr6NWnwrEMTQDqb5loeP2tbs+oj3TA7yLWg/qFQidjmZE8e7bL/INDW/6qmdq+ERsaJ4mCMWBIwCm78nAdP9Vc8n7Z92KvNkTf3AVe45HM6GXWH3pJ94Hpv1V9GTjJO5VUV4lHSTUV1DCNJNJAGNCSaQxoSTQAJpoTAaaSaBCUkJIAkux2SdWYz0d/I/yXHWfGyTHyoe8HhwaC+23QvoPFQqK8GkSg7STZ7hjuboA2IrcdDa8k4qGQ5eTG0BjWyyANAoNbZoAeFKy8I7XxEBrnaT4HZV7trjd9L9pxzq1gNkY02/VVagOorSF5/G0ZuKstj1XA8VTp1pRqSspLtdPS/wC739ziYGP9py4YbrXI23dQ27v9CvUc/JY0myABzXnHBhFhytnmdqlAJZDHvpLm7F7uVgEigtvinFXTRF4DgzVpLiCAXnerTweGnCN5K1389w47j6eJrRjTleMV2u3rbso9zD2g4mJZCGn3R+q5WslQDb5prtwopLU81OrfYki1FNXlBbezvbifHqOdpni5A3UjB5Hr6FXnD4hhZrdUEjXOqzHeiVvq0rxhTje5pDmktcNw5poj0IWaphYy1WjLoV2t9T1bMwD0mDT+F9sP9FyM/Em0PBsgscAQ7UNweoXC4f2yy4wGS6chnhIPe/7v6grov7SYMjSakidR9wtLhfkRf8lm8GpB7X9C9VYS5lJCEBC6bMI0kISGYk0lJAwTSTQA0ITQIE0JIAaEITAaEkIEZY8qVgppa5v4JGCRv0PL5Ilzb/5MbT4xuewfS6WJNVulG9y1VWlYgx8lEWADzsaiT0O62cbOnia5jJXhp+Jt20/I7LAkjw49BOcnzBNJCmQBCSEASQkhADQkmgBIQhAgSTSTA//Z");

	canvasSketch(sketch, settings);
};

start();


class Particle {
	constructor({ x, y, radius = 10, colMap }) {
		this.x = x;
		this.y = y;

		this.ax = 0;
		this.ay = 0;

		this.vx = 0;
		this.vy = 0;

		this.ix = x;
		this.iy = y;

		this.radius = radius;
		this.scale = 3;
		this.colMap = colMap;
		this.color = colMap(0);

		this.minDist = random.range(100, 200);
		this.pushFactor = random.range(0.01, 0.02);
		this.pullFactor = random.range(0.002, 0.006);
		this.dampFactor = random.range(0.90, 0.95);
	}

	update() {
		let dx, dy, dd, distDelta;
		let idxColor;

		dx = this.ix - this.x;
		dy = this.iy - this.y;
		dd = Math.sqrt(dx * dx + dy * dy);

		this.ax = dx * this.pullFactor;
		this.ay = dy * this.pullFactor;

		this.scale = math.mapRange(dd, 0, 200, 1, 5);


		this.color = this.colMap(math.mapRange(dd, 0, 200, 0, 1, true));

		dx = this.x - cursor.x;
		dy = this.y - cursor.y;
		dd = Math.sqrt(dx * dx + dy * dy);

		distDelta = this.minDist - dd;

		if (dd < this.minDist) {
			this.ax += (dx / dd) * distDelta * this.pushFactor;
			this.ay += (dy / dd) * distDelta * this.pushFactor;
		}

		this.vx += this.ax;
		this.vy += this.ay;

		this.vx *= this.dampFactor;
		this.vy *= this.dampFactor;

		this.x += this.vx;
		this.y += this.vy;
	}

	draw(context) {
		context.save();
		context.translate(this.x, this.y);
		context.fillStyle = this.color;

		context.beginPath();
		context.arc(0, 0, this.radius * this.scale, 0, Math.PI * 2);
		context.fill();

		context.restore();
	}
}