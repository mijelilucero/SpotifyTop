/**
 * Clase Cola para gestionar las canciones con el principio FIFO
 */
class Cola {
    constructor() {
        this.elementos = [];
    }

    /**
     * Añade una canción al final de la cola
     * @param {Object} cancion - Objeto con información de la canción
     */
    enqueue(cancion) {
        this.elementos.push(cancion);
        return this.elementos.length;
    }

    /**
     * Elimina y devuelve la canción más antigua de la cola
     * @returns {Object|null} - La canción eliminada o null si la cola está vacía
     */
    dequeue() {
        if (this.elementos.length === 0) {
            return null;
        }
        return this.elementos.shift();
    }

    /**
     * Devuelve la primera canción sin eliminarla
     * @returns {Object|null} - La primera canción o null si la cola está vacía
     */
    peek() {
        if (this.elementos.length === 0) {
            return null;
        }
        return this.elementos[0];
    }

    /**
     * Devuelve todas las canciones en la cola
     * @returns {Array} - Array con todas las canciones
     */
    mostrar() {
        return [...this.elementos];
    }

    /**
     * Verifica si la cola está vacía
     * @returns {boolean} - true si está vacía, false en caso contrario
     */
    estaVacia() {
        return this.elementos.length === 0;
    }

    /**
     * Devuelve el número de elementos en la cola
     * @returns {number} - Cantidad de elementos
     */
    tamano() {
        return this.elementos.length;
    }
}