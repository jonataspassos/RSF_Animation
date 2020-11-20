var time_turn = 0.001,
    transition_duration = 2000,
    state_duration = 1000,
    n_package = 50;


function X(p) {
    var u = (Math.random() + 1.0) / (3.0); // u in (0,1)
    return -p * Math.log(u);
}

class Package {
    constructor(start) {
        this.start = start;
        this.router = [];// time turn on server input
        this.duration = [];// time duration in server
        //this.update = false;
    }
    get timeoutserver() {
        var i = this.router.length - 1;
        return this.router[i] + this.duration[i];
    }

    get r() {
        return this.router.length;
    }
}

class LogPackage {
    constructor(nf, ic, ts, tcf, tis, tfs, is) {
        this.nf = nf;
        this.ic = ic;
        this.ts = ts;
        this.tcf = tcf;
        this.tis = tis;
        this.tfs = tfs;
        this.is = is;
    }
}

class Queue {
    constructor(m) {//mi em pps
        this.m = m * time_turn;//mi em turnos
        this.tms = 1 / this.m;//tms em turnos
        this.log = [];

        this.pack_queue = [];
        this.server_pack = null;
    }
    turn(time, next) { // gerencia a movimentação dos pacotes dentro do sistema de fila
        if (next) {
            this.pack_queue.push(next);//entra na fila
        }
        if (!this.server_pack || time >= this.server_pack.timeoutserver) {
            var ret = this.server_pack;

            //this.server_pack.update = true;
            this.server_pack = null;
            if (this.pack_queue.length != 0) {// Fila não vazia, 
                this.server_pack = this.pack_queue[0];//pega o primeiro da fila
                this.pack_queue = this.pack_queue.slice(1);//atualiza a fila

                this.server_pack.router.push(time);//Marca o tempo de entrada
                this.server_pack.duration.push(Math.ceil(X(this.tms)));//Calcula a duração do 
                //pacote no servidor
            }
            return ret;
        }
        return null;
    }
}

class NetQueue {
    constructor(l, m, r) {
        this.l = l * time_turn;//lambda em turnos
        this.imc = 1 / this.l;

        this.r = r;
        this.queues = [];
        for (var i = 0; i < m.length; i++) {
            this.queues.push(new Queue(m[i]));
        }

        this.out = null;

        this.time = 0;
        this.create_next = 0;
    }
    turn() { // Gerencia a entrada e saída de pacotes de cada sistema de fila
        if (this.time >= this.create_next) {
            this.next = new Package(this.time);
            this.next = this.queues[this.r[0]].turn(this.time, this.next);
            
            this.out = null;
            while (this.next) {
                if(this.next.r < this.r.length)
                    this.next = this.queues[this.r[this.next.r]].turn(this.time, this.next);
                else
                    this.out = this.next, this.next = null;
            }

            this.create_next = this.time + Math.ceil(X(this.imc));
        }

        for (var i = 0; i < this.queues.length; i++) {
            this.next = this.queues[i].turn(this.time, this.next);
            while (this.next) {
                if(this.next.r < this.r.length)
                    this.next = this.queues[this.r[this.next.r]].turn(this.time, this.next);
                else
                    this.out = this.next, this.next = null;
            }
        }
        console.log(`    ___        ___        ___ `);
        console.log(` ->  ${this.queues[0].pack_queue.length} |(${this.queues[0].server_pack?'O':' '}) ->  ${this.queues[1].pack_queue.length} |(${this.queues[1].server_pack?'O':' '}) ->  ${this.queues[2].pack_queue.length} |(${this.queues[2].server_pack?'O':' '})`);
        console.log(`    ---        ---        --- `);

        this.time++;
    }
}