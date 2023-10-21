
const encoding = "url('data:image/png;base64,";
const customCursors ={
	wheel_step : {
		center : " 13 9, ",
		image : "iVBORw0KGgoAAAANSUhEUgAAABsAAAAMCAYAAACTB8Z2AAAA4klEQVQ4T51U0RWEIAwr8zGCQziLQ7APSzCHZznCS3vF844ffdI0Tdqa5OE5r5NSkush1zM9hJmwD5AmRQSSMpG/86QRfmI42FXfVeiJhEQKIzy7MJX5QCVBQm/hylJ8J6yxvZMtKuqicE/2GcWscJUHMemLdfMeZAMYEvre0kC9Fd4pQ+LjODrXvu/SWpNaq+ScYdEkRn+5IJ7gJz0TkIGwlCLbthkyVnHbM7KId6kXCmtYnb6rSihA8oWyKSjcMx3XQWJsBskiOccafLhnfkFXOzgUmOR32J/JaJD++lUp/gXZ7CEYd6orLAAAAABJRU5ErkJggg==')"
	},
};
for (const [name, curs] of Object.entries(customCursors)) {
	customCursors[name] = encoding + curs.image + curs.center + " pointer";
}
export {customCursors}

