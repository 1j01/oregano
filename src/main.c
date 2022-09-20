#include "wasm4.h"
#include <math.h>

#define MAX_PARTICLES 500

const uint8_t smiley[] = {
    0b11000011,
    0b10000001,
    0b00100100,
    0b00100100,
    0b00000000,
    0b00100100,
    0b10011001,
    0b11000011,
};

struct Particle
{
    double x;
    double y;
    double vx;
    double vy;
    int life;
};

struct Particle particles[MAX_PARTICLES];

void add_particle(struct Particle particle)
{
    for (int i = 0; i < MAX_PARTICLES; i++)
    {
        if (particles[i].life <= 0)
        {
            particles[i] = particle;
            break;
        }
    }
}

int t = 0;

void update()
{
    t++;

    *DRAW_COLORS = 2;
    text("Hello from C!", 10, 10);

    uint8_t gamepad = *GAMEPAD1;
    if (gamepad & BUTTON_1)
    {
        *DRAW_COLORS = 4;
        
        struct Particle p = {80, 80, sin(t), cos(t), 100};
        add_particle(p);
    }

    for (int i = 0; i < MAX_PARTICLES; i++)
    {
        struct Particle* p = &particles[i];
        if (p->life > 0)
        {
            p->x += p->vx;
            p->y += p->vy;
            p->life -= 1;
            blit(smiley, (int32_t)p->x, (int32_t)p->y, 8, 8, BLIT_1BPP);
        }
    }
    text("Press X to spawn", 16, 90);
    text("some particles!", 22, 103);
}
