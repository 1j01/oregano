#include "wasm4.h"
#include <math.h>
#include <stdlib.h>

#define MAX_PARTICLES 500
#define MAX_STICKS 300
#define ITERATIONS 4

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

typedef struct
{
    double x;
    double y;
    double vx;
    double vy;
    int life;
} particle_t;

typedef struct
{
    particle_t *a;
    particle_t *b;
    double restLength;
    int life;
} stick_t;

particle_t particles[MAX_PARTICLES];
stick_t sticks[MAX_STICKS];

// stupid methods just for adding to arrays
// I'm learning C.
// Probably should track the count, and shift elements when removing.
int add_particle(particle_t particle)
{
    for (int i = 0; i < MAX_PARTICLES; i++)
    {
        if (particles[i].life <= 0)
        {
            particles[i] = particle;
            return i;
        }
    }
    return -1;
}

int add_stick(stick_t stick)
{
    for (int i = 0; i < MAX_STICKS; i++)
    {
        if (sticks[i].life <= 0)
        {
            sticks[i] = stick;
            return i;
        }
    }
    return -1;
}

int t = 0;

void step()
{
    for (int it = 0; it < ITERATIONS; it++)
    {
        for (int i = 0; i < MAX_STICKS; i++)
        {
            stick_t *s = &sticks[i];
            if (s->life > 0)
            {
                double dx = s->a->x - s->b->x;
                double dy = s->a->y - s->b->y;
                double d = sqrt(dx * dx + dy * dy);
                double delta = s->restLength - d;
                double force = delta * 0.00001;
                s->a->vx += force * dx;
                s->a->vy += force * dy;
                s->b->vx -= force * dx;
                s->b->vy -= force * dy;
            }
        }
    }

    for (int i = 0; i < MAX_STICKS; i++)
    {
        stick_t *s = &sticks[i];
        if (abs((int32_t)(s->a->x - s->b->x)) > 800 ||
            abs((int32_t)(s->a->y - s->b->y)) > 800 ||
            s->a->life <= 0 ||
            s->a->life <= 0)
        {
            s->life = 0;
        }
    }
    for (int i = 0; i < MAX_PARTICLES; i++)
    {
        particle_t *p = &particles[i];
        if (p->life > 0)
        {
            p->x += p->vx;
            p->y += p->vy;
        }
    }
}

void draw()
{

    *DRAW_COLORS = 2;
    text("Hello from C!", 10, 10);

    for (int i = 0; i < MAX_STICKS; i++)
    {
        stick_t *s = &sticks[i];
        if (s->life > 0)
        {
            // s->life -= 1;
            line((int32_t)s->a->x, (int32_t)s->a->y, (int32_t)s->b->x, (int32_t)s->b->y);
        }
    }

    for (int i = 0; i < MAX_PARTICLES; i++)
    {
        particle_t *p = &particles[i];
        if (p->life > 0)
        {
            // p->life -= 1;
            blit(smiley, (int32_t)p->x, (int32_t)p->y, 8, 8, BLIT_1BPP);
        }
    }

    text("Press X to spawn", 16, 90);
    text("some particles!", 22, 103);
}

void update()
{
    t++;

    uint8_t gamepad = *GAMEPAD1;
    if (gamepad & BUTTON_1)
    {
        *DRAW_COLORS = 4;

        particle_t p = {80, 80, sin(t), cos(t), 100};
        int p_i = add_particle(p);
        stick_t stick = {&particles[p_i], &particles[p_i - 1], 10, 100};
        add_stick(stick);
    }

    step();
    draw();
}
