class Cola {
    constructor() {
        this.cola = [];
    }

    // Agregar una canción a la cola
    enqueue(cancion) {
        this.cola.push(cancion);
    }

    // Eliminar y devolver la canción más antigua de la cola
    dequeue() {
        if (this.isEmpty()) {
            console.log("La cola está vacía");
            return null;
        }
        return this.cola.shift();
    }

    // Verificar si la cola está vacía
    isEmpty() {
        return this.cola.length === 0;
    }

    // Mostrar todas las canciones en la cola
    mostrar() {
        console.log("Canciones en la cola:");
        this.cola.forEach((cancion, index) => {
            console.log(`${index + 1}: ${cancion.name} - ${cancion.artist}`);
        });
    }
}